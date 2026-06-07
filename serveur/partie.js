// serveur/partie.js
// Machine à états d'une partie « Devine le dessin ».
// Pure et déterministe (sauf tirage des mots, injectable pour les tests).
// Pas de setTimeout ici : le chrono est géré par serveur.js.
const { normaliser, estProche } = require('./normaliser');
const motsParDefaut = require('./mots');

class Partie {
  // joueurs: [{id, pseudo, mascotte?}]
  // reglages: { manches, duree } (duree en secondes)
  // deps: { tirerTrois } injectable pour les tests
  constructor(joueurs, reglages, deps = {}) {
    this.joueurs = joueurs;
    this.reglages = reglages;
    this.tirerTrois = deps.tirerTrois || motsParDefaut.tirerTrois;
    this.ordre = joueurs.map((j) => j.id);
    this.indexDessinateur = -1;
    this.manche = 1;
    this._scores = Object.fromEntries(this.ordre.map((id) => [id, 0]));
    this.motsUtilises = new Set();
    this.finie = false;
    // Nombre total de tours pour toute la partie
    this._totalTours = joueurs.length * reglages.manches;
    this._toursJoues = 0;
    this._resetTour();
  }

  _resetTour() {
    this.dessinateurId = null;
    this.mot = null;
    this.aTrouve = new Set();  // ids des devineurs ayant trouvé ce tour
    this.tourActif = false;
    this.motsProposes = null;
  }

  // Démarre le tour suivant.
  // Retourne { dessinateurId, mots } ou null si la partie est finie.
  demarrerTour() {
    if (this.finie) return null;
    this._resetTour();
    this.indexDessinateur++;
    if (this.indexDessinateur >= this.ordre.length) {
      // Fin de manche : passer à la suivante
      this.indexDessinateur = 0;
      this.manche++;
    }
    if (this.manche > this.reglages.manches) {
      this.finie = true;
      return null;
    }
    this.dessinateurId = this.ordre[this.indexDessinateur];
    this.motsProposes = this.tirerTrois(this.motsUtilises);
    return { dessinateurId: this.dessinateurId, mots: this.motsProposes };
  }

  // Le dessinateur choisit un mot parmi les 3 proposés.
  choisirMot(mot) {
    this.mot = mot;
    this.motsUtilises.add(mot);
    this.tourActif = true;
    return { nbLettres: mot.length, duree: this.reglages.duree };
  }

  // Traite la devinette d'un joueur. tempsRestant en secondes (fourni par serveur.js).
  deviner(joueurId, texte, tempsRestant) {
    if (!this.tourActif) return { resultat: 'inactif' };
    if (joueurId === this.dessinateurId) return { resultat: 'interdit' };
    if (this.aTrouve.has(joueurId)) return { resultat: 'deja' };
    if (normaliser(texte) === normaliser(this.mot)) {
      const points = this._pointsDevineur(tempsRestant);
      this._scores[joueurId] += points;
      this._scores[this.dessinateurId] += this._pointsDessinateur();
      this.aTrouve.add(joueurId);
      return { resultat: 'exact', points };
    }
    if (estProche(texte, this.mot)) return { resultat: 'proche' };
    return { resultat: 'faux' };
  }

  // Calcule les points du devineur selon la rapidité (50 à 150).
  _pointsDevineur(tempsRestant) {
    const ratio = Math.max(0, tempsRestant) / this.reglages.duree;
    return 50 + Math.round(ratio * 100);
  }

  // Points accordés au dessinateur pour chaque devineur correct.
  _pointsDessinateur() { return 25; }

  // Retourne true si tous les devineurs (non-dessinateur) ont trouvé.
  tousOntTrouve() {
    const nbDevineurs = this.ordre.length - 1;
    return this.aTrouve.size >= nbDevineurs;
  }

  // Appelé quand un joueur quitte la partie en cours de tour.
  joueurParti(joueurId) {
    if (joueurId === this.dessinateurId && this.tourActif) {
      // Le dessinateur est parti : le tour s'arrête immédiatement.
      this.tourActif = false;
      return { tourTermine: true, mot: this.mot };
    }
    // Un devineur est parti : on le retire de "aTrouve" (ne bloque plus tousOntTrouve)
    this.aTrouve.delete(joueurId);
    // Aussi retirer de l'ordre pour les prochains tours ? On garde simple pour la v1.
    return { tourTermine: false };
  }

  // Clôture le tour en cours. Renvoie le mot et les scores.
  // Détecte aussi si la partie est terminée (tous les tours joués).
  finTour() {
    this.tourActif = false;
    this._toursJoues++;
    if (this._toursJoues >= this._totalTours) {
      this.finie = true;
    }
    return { mot: this.mot, scores: this.scores() };
  }

  estFinie() { return this.finie; }

  scores() { return { ...this._scores }; }

  // Classement trié par points décroissants.
  classement() {
    return this.joueurs
      .map((j) => ({ id: j.id, pseudo: j.pseudo, points: this._scores[j.id] || 0 }))
      .sort((a, b) => b.points - a.points);
  }
}

module.exports = { Partie };
