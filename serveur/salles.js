// serveur/salles.js
// Logique PURE de gestion des salles (aucun WebSocket ici → facile à tester).
class GestionnaireSalles {
  constructor() {
    this.salles = {};         // code -> { hoteSocket, joueurs: [{ socketId, pseudo, mascotte, estHote }] }
    this.socketVersCode = {}; // socketId -> code (pour retrouver vite la salle)
  }

  genererCode() {
    // Code = simple suite de 4 chiffres (ex. "4829"), facile à dire et à taper.
    let code;
    do { code = String(Math.floor(1000 + Math.random() * 9000)); } while (this.salles[code]);
    return code;
  }

  creerSalle(socketId, profil) {
    const code = this.genererCode();
    const joueur = { socketId, pseudo: profil.pseudo, mascotte: profil.mascotte, estHote: true };
    this.salles[code] = { hoteSocket: socketId, joueurs: [joueur] };
    this.socketVersCode[socketId] = code;
    return { code, joueur };
  }

  rejoindreSalle(socketId, code, profil) {
    const salle = this.salles[code];
    if (!salle) return { ok: false, code: 'SALLE_INTROUVABLE' };
    const joueur = { socketId, pseudo: profil.pseudo, mascotte: profil.mascotte, estHote: false };
    salle.joueurs.push(joueur);
    this.socketVersCode[socketId] = code;
    return { ok: true, codeSalle: code };
  }

  retirer(socketId) {
    const code = this.socketVersCode[socketId];
    if (!code || !this.salles[code]) return null;
    const salle = this.salles[code];
    salle.joueurs = salle.joueurs.filter((j) => j.socketId !== socketId);
    delete this.socketVersCode[socketId];
    const hotePartiOuVide = salle.hoteSocket === socketId || salle.joueurs.length === 0;
    if (hotePartiOuVide) { delete this.salles[code]; return { code, ferme: true }; }
    return { code, ferme: false };
  }

  codeDuSocket(socketId) { return this.socketVersCode[socketId]; }

  estHote(socketId) {
    const code = this.socketVersCode[socketId];
    return !!code && this.salles[code] && this.salles[code].hoteSocket === socketId;
  }

  listeJoueurs(code) {
    return this.salles[code] ? this.salles[code].joueurs.map(({ socketId, ...reste }) => ({ id: socketId, ...reste })) : [];
  }

  socketsDe(code) { return this.salles[code] ? this.salles[code].joueurs.map((j) => j.socketId) : []; }
}

module.exports = { GestionnaireSalles };
