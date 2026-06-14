// src/reseau/ClientReseau.js
// SEULE porte vers le réseau. Les écrans n'utilisent QUE ces fonctions.
// Pour passer un jour à une architecture "téléphone-serveur", on ne modifiera
// que ce fichier.
//
// NOTE : on utilise l'objet global WebSocket fourni par React Native.
// On n'importe PAS la lib "ws" (qui est côté serveur Node.js uniquement).
import { construire, parser } from './protocole';

let socket = null;
const abonnes = {}; // evenement -> [callbacks]

// Mon identifiant de joueur, attribué par le serveur à la connexion.
// Sert à savoir « est-ce moi le dessinateur ? » et à me reconnaître dans les scores.
let _monId = null;
export function monId() { return _monId; }

// On mémorise la DERNIÈRE liste de joueurs reçue. Pourquoi ? Le serveur envoie
// la liste juste après qu'on crée/rejoint une salle, c'est-à-dire pendant qu'on
// change d'écran. L'écran "Salle d'attente" peut donc ne pas encore être abonné
// au moment où la liste arrive. En la rejouant aux nouveaux abonnés, on évite
// que la liste de joueurs reste vide (condition de course).
let derniereListeJoueurs = null;
// Idem pour Turbo Jackpot : le serveur envoie COURSE_DEMARRE / ETAT_COURSE pendant
// qu'on change d'écran. On mémorise le dernier état et on le rejoue aux nouveaux
// abonnés pour que l'écran de course ne reste pas vide (condition de course).
let dernierCourseDemarre = null;
let dernierEtatCourse = null;
// Idem pour Beboudle : la manche et les indices peuvent arriver avant le montage
// de l'écran de jeu. On mémorise pour les rejouer aux nouveaux abonnés.
let dernierBeboudleManche = null; // dernière BEBOUDLE_MANCHE reçue
let indicesBeboudle = [];         // indices révélés de la manche courante

function emettre(evenement, donnees) {
  if (evenement === 'listeJoueurs') derniereListeJoueurs = donnees;
  if (evenement === 'courseDemarre') dernierCourseDemarre = donnees;
  if (evenement === 'etatCourse') dernierEtatCourse = donnees;
  if (evenement === 'courseFinie') { dernierCourseDemarre = null; dernierEtatCourse = null; }
  if (evenement === 'beboudleManche') { dernierBeboudleManche = donnees; indicesBeboudle = []; }
  if (evenement === 'revelerIndice') indicesBeboudle.push(donnees);
  if (evenement === 'beboudleMancheFinie') indicesBeboudle = [];
  if (evenement === 'beboudleFinie') { dernierBeboudleManche = null; indicesBeboudle = []; }
  (abonnes[evenement] || []).forEach((cb) => cb(donnees));
}

// S'abonner à un événement entrant. Renvoie une fonction pour se désabonner.
export function sur(evenement, callback) {
  if (!abonnes[evenement]) abonnes[evenement] = [];
  abonnes[evenement].push(callback);
  // On rejoue tout de suite la dernière liste connue au nouvel abonné, pour
  // qu'il ne rate pas une liste arrivée pendant la transition d'écran.
  if (evenement === 'listeJoueurs' && derniereListeJoueurs !== null) callback(derniereListeJoueurs);
  if (evenement === 'courseDemarre' && dernierCourseDemarre !== null) callback(dernierCourseDemarre);
  if (evenement === 'etatCourse' && dernierEtatCourse !== null) callback(dernierEtatCourse);
  if (evenement === 'beboudleManche' && dernierBeboudleManche !== null) callback(dernierBeboudleManche);
  if (evenement === 'revelerIndice') indicesBeboudle.forEach((d) => callback(d));
  return () => { abonnes[evenement] = abonnes[evenement].filter((c) => c !== callback); };
}

// Transforme ce que l'utilisateur saisit en URL WebSocket valide.
// Accepte plusieurs formes pratiques :
//   - "192.168.1.20:8080"            (PC local)        -> ws://192.168.1.20:8080
//   - "bebouparty.onrender.com"      (cloud, domaine)  -> wss://bebouparty.onrender.com
//   - "https://bebouparty.onrender.com" (collé du navigateur) -> wss://bebouparty.onrender.com
//   - "ws://..." ou "wss://..."      (déjà complet)    -> inchangé
export function construireUrl(adresse) {
  const a = (adresse || '').trim().replace(/\/+$/, ''); // enlève les / de fin
  if (/^wss?:\/\//i.test(a)) return a;                  // déjà ws:// ou wss://
  if (/^https?:\/\//i.test(a)) return a.replace(/^http/i, 'ws'); // http->ws, https->wss
  if (a.includes(':')) return `ws://${a}`;              // contient un port -> local (ws)
  return `wss://${a}`;                                   // domaine seul -> cloud sécurisé (wss)
}

// Adresse du serveur de jeu EN LIGNE (cloud Render).
// Tout le monde s'y connecte, quel que soit le réseau (WiFi, 4G/5G) : aucun
// besoin d'être sur le même WiFi. On la fige ici pour éviter toute erreur d'adresse.
export const ADRESSE_SERVEUR = 'bebouparty.onrender.com';

// adresse : domaine cloud (défaut) ou "IP:port" pour un serveur local de test.
export async function connecter(adresse = ADRESSE_SERVEUR) {
  // Nouvelle session : on oublie la liste de joueurs et l'identifiant précédents.
  derniereListeJoueurs = null;
  dernierCourseDemarre = null;
  dernierEtatCourse = null;
  dernierBeboudleManche = null;
  indicesBeboudle = [];
  _monId = null;

  const urlWs = construireUrl(adresse);
  // URL HTTP(S) équivalente, pour réveiller le serveur (ws->http, wss->https).
  const urlHttp = urlWs.replace(/^ws/i, 'http');

  // 1) RÉVEIL : sur l'offre gratuite Render, le serveur s'endort après ~15 min.
  // Cette requête HTTP "attend" qu'il se réveille (jusqu'à ~1 min la 1re fois),
  // de sorte que le WebSocket se connecte ensuite à un serveur déjà réveillé.
  try {
    let ctrl, minuteur;
    if (typeof AbortController !== 'undefined') {
      ctrl = new AbortController();
      minuteur = setTimeout(() => ctrl.abort(), 70000);
    }
    await fetch(urlHttp, ctrl ? { signal: ctrl.signal } : undefined);
    if (minuteur) clearTimeout(minuteur);
  } catch (e) {
    // Échec du réveil : on tente quand même la connexion WebSocket juste après.
  }

  // 2) Connexion WebSocket vers le serveur (désormais) réveillé.
  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(urlWs);
    } catch (e) { reject(e); return; }

    let resolu = false;
    socket.onopen = () => { resolu = true; resolve(); };
    socket.onerror = () => {
      if (!resolu) reject(new Error('connexion impossible'));
      else emettre('deconnecte');
    };
    socket.onclose = () => { if (resolu) emettre('deconnecte'); };
    socket.onmessage = (ev) => {
      const msg = parser(ev.data);
      if (!msg) return;
      // On traduit chaque message serveur en événement clair pour les écrans
      switch (msg.type) {
        case 'MON_ID': _monId = msg.id; emettre('monId', msg.id); break;
        case 'SALLE_CREEE': emettre('salleCreee', msg); break;
        case 'LISTE_JOUEURS': emettre('listeJoueurs', msg.joueurs); break;
        case 'PARTIE_LANCEE': emettre('partieLancee'); break;
        case 'JEU_CHOISI': emettre('jeuChoisi', msg.idJeu); break;
        case 'ERREUR': emettre('erreur', msg); break;
        // Événements du jeu « Devine le dessin »
        case 'CHOIX_MOTS': emettre('choixMots', msg.mots); break;
        case 'PREPARATION': emettre('preparation', msg); break;
        case 'TOUR_DEMARRE': emettre('tourDemarre', msg); break;
        case 'TRAIT_DEBUT': emettre('traitDebut', msg); break;
        case 'TRAIT_POINTS': emettre('traitPoints', msg); break;
        case 'TRAIT_FIN': emettre('traitFin', msg); break;
        case 'ANNULER': emettre('annuler'); break;
        case 'EFFACER_TOUT': emettre('effacerTout'); break;
        case 'FOND': emettre('fond', msg.couleur); break;
        case 'A_TROUVE': emettre('aTrouve', msg); break;
        case 'PRESQUE': emettre('presque', msg); break;
        case 'MESSAGE_CHAT': emettre('messageChat', msg); break;
        case 'SCORES': emettre('scores', msg.scores); break;
        case 'TOUR_FINI': emettre('tourFini', msg); break;
        case 'PARTIE_FINIE': emettre('partieFinie', msg.classement); break;
        // Événements du mini-jeu « Turbo Jackpot »
        case 'COURSE_DEMARRE': emettre('courseDemarre', msg); break;
        case 'ETAT_COURSE': emettre('etatCourse', msg); break;
        case 'FEED': emettre('feed', msg); break;
        case 'COURSE_FINIE': emettre('courseFinie', msg.classement); break;
        // Événements du mini-jeu « Beboudle »
        case 'BEBOUDLE_MANCHE': emettre('beboudleManche', msg); break;
        case 'REVELER_INDICE': emettre('revelerIndice', msg); break;
        case 'A_REPONDU': emettre('aRepondu', msg); break;
        case 'BEBOUDLE_MANCHE_FINIE': emettre('beboudleMancheFinie', msg); break;
        case 'BEBOUDLE_FINIE': emettre('beboudleFinie', msg.classement); break;
      }
    };
  });
}

function envoyer(type, donnees) {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(construire(type, donnees));
}

export function creerSalle(profil) { envoyer('CREER_SALLE', { profil }); }
export function rejoindreSalle(code, profil) { envoyer('REJOINDRE_SALLE', { code, profil }); }
export function lancerPartie() { envoyer('LANCER_PARTIE'); }
// reglages : { manches, duree } — transmis au serveur pour configurer la partie
export function choisirJeu(idJeu, reglages) { envoyer('CHOISIR_JEU', { idJeu, reglages }); }
export function quitter() { if (socket) socket.close(); socket = null; derniereListeJoueurs = null; }

// Fonctions de jeu « Devine le dessin »
export function choisirMot(mot) { envoyer('CHOISIR_MOT', { mot }); }
export function traitDebut(t) { envoyer('TRAIT_DEBUT', t); }           // t = {id, couleur, taille}
export function traitPoints(id, points) { envoyer('TRAIT_POINTS', { id, points }); }
export function traitFin(id) { envoyer('TRAIT_FIN', { id }); }
export function annulerTrait() { envoyer('ANNULER'); }
export function effacerTout() { envoyer('EFFACER_TOUT'); }
export function changerFond(couleur) { envoyer('FOND', { couleur }); }
export function deviner(texte) { envoyer('DEVINER', { texte }); }

// Fonctions de jeu « Turbo Jackpot »
export function ticketTermine(symboles) { envoyer('TICKET_TERMINE', { symboles }); }

// Fonctions de jeu « Beboudle »
// Note : on n'utilise PAS choisirJeu (qui enveloppe dans `reglages` pour le dessin) ;
// le serveur lit `personnes`/`manches` au premier niveau pour Beboudle.
export function choisirBeboudle(personnes, manches = 10) {
  envoyer('CHOISIR_JEU', { idJeu: 'beboudle', personnes, manches });
}
export function repondre(personneId) { envoyer('REPONDRE', { personneId }); }
