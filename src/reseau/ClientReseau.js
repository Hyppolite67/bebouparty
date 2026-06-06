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

// adresse = "192.168.1.20:8080"
export function connecter(adresse) {
  // Nouvelle session : on oublie la liste de joueurs d'une éventuelle partie précédente.
  derniereListeJoueurs = null;
  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(`ws://${adresse}`);
    } catch (e) { reject(e); return; }

    socket.onopen = () => resolve();
    socket.onerror = () => { emettre('deconnecte'); reject(new Error('connexion impossible')); };
    socket.onclose = () => emettre('deconnecte');
    socket.onmessage = (ev) => {
      const msg = parser(ev.data);
      if (!msg) return;
      // On traduit chaque message serveur en événement clair pour les écrans
      switch (msg.type) {
        case 'SALLE_CREEE': emettre('salleCreee', msg); break;
        case 'LISTE_JOUEURS': emettre('listeJoueurs', msg.joueurs); break;
        case 'PARTIE_LANCEE': emettre('partieLancee'); break;
        case 'JEU_CHOISI': emettre('jeuChoisi', msg.idJeu); break;
        case 'ERREUR': emettre('erreur', msg); break;
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
export function choisirJeu(idJeu) { envoyer('CHOISIR_JEU', { idJeu }); }
export function quitter() { if (socket) socket.close(); socket = null; derniereListeJoueurs = null; }
