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

function emettre(evenement, donnees) {
  if (evenement === 'listeJoueurs') derniereListeJoueurs = donnees;
  (abonnes[evenement] || []).forEach((cb) => cb(donnees));
}

// S'abonner à un événement entrant. Renvoie une fonction pour se désabonner.
export function sur(evenement, callback) {
  if (!abonnes[evenement]) abonnes[evenement] = [];
  abonnes[evenement].push(callback);
  // On rejoue tout de suite la dernière liste connue au nouvel abonné, pour
  // qu'il ne rate pas une liste arrivée pendant la transition d'écran.
  if (evenement === 'listeJoueurs' && derniereListeJoueurs !== null) callback(derniereListeJoueurs);
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

// adresse = "192.168.1.20:8080" (local) ou "bebouparty.onrender.com" (cloud)
export function connecter(adresse) {
  // Nouvelle session : on oublie la liste de joueurs et l'identifiant précédents.
  derniereListeJoueurs = null;
  _monId = null;
  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(construireUrl(adresse));
    } catch (e) { reject(e); return; }

    socket.onopen = () => resolve();
    socket.onerror = () => { emettre('deconnecte'); reject(new Error('connexion impossible')); };
    socket.onclose = () => emettre('deconnecte');
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
