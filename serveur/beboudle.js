// serveur/beboudle.js
// Logique pure du mini-jeu « Beboudle » (deviner une personne via 4 emojis).
// Aucun setTimeout ici : les timers de révélation sont gérés par serveur.js.
const POINTS_PAR_INDICE = { 1: 500, 2: 300, 3: 150, 4: 50 };
const MALUS_FAUX = -100;

function melangeParDefaut(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Beboudle {
  // joueurs   : [{ id, pseudo, mascotte? }]
  // personnes : [{ id, nom, combos: [[e1,e2,e3,e4], ...] }] (combos vides tolérés)
  // deps.melanger : fn(array)->array injectable pour des tests déterministes
  constructor(joueurs, { personnes = [], manches = 10 } = {}, deps = {}) {
    this.joueurs = joueurs;
    this.personnes = personnes;
    this.melanger = deps.melanger || melangeParDefaut;
    this._scores = Object.fromEntries(joueurs.map((j) => [j.id, 0]));

    // Tous les couples (personne, combo rempli) → une manche chacun.
    const couples = [];
    for (const p of personnes) {
      for (const combo of (p.combos || [])) {
        if (Array.isArray(combo) && combo.length === 4) couples.push({ personneId: p.id, combo });
      }
    }
    this._manches = this.melanger(couples).slice(0, manches);
    this._total = this._manches.length;
    this._index = -1;       // index de la manche courante
    this._courante = null;  // { personneId, combo, choix, indice, reponses }
    this._finie = false;
  }

  _personne(id) { return this.personnes.find((p) => p.id === id) || { id, nom: '?' }; }

  // Démarre la manche suivante. Retourne { manche, total, choix } ou null si fini.
  demarrerManche() {
    this._index++;
    if (this._index >= this._total) { this._finie = true; return null; }
    const { personneId, combo } = this._manches[this._index];

    // 6 choix = bonne personne + 5 autres distinctes, mélangés (plafonné si < 6 personnes).
    const autres = this.melanger(this.personnes.filter((p) => p.id !== personneId)).slice(0, 5);
    const choixPersonnes = this.melanger([this._personne(personneId), ...autres]);
    const choix = choixPersonnes.map((p) => ({ id: p.id, nom: p.nom }));

    this._courante = { personneId, combo, choix, indice: 1, reponses: {} };
    return { manche: this._index + 1, total: this._total, choix };
  }

  // Emoji i (0..3) de la manche courante — usage serveur (broadcast 1 par 1).
  emoji(i) { return this._courante ? this._courante.combo[i] : null; }

  // Révèle l'indice suivant. Retourne { indice, emoji } (indice 1-based) ou null si déjà 4.
  revelerProchain() {
    const c = this._courante;
    if (!c || c.indice >= 4) return null;
    c.indice++;
    return { indice: c.indice, emoji: c.combo[c.indice - 1] };
  }

  // Enregistre la réponse d'un joueur (une seule par manche).
  repondre(joueurId, personneId) {
    const c = this._courante;
    if (!c || c.reponses[joueurId] !== undefined) return { ok: false };
    c.reponses[joueurId] = personneId;
    const correct = personneId === c.personneId;
    const points = correct ? POINTS_PAR_INDICE[c.indice] : MALUS_FAUX;
    this._scores[joueurId] += points;
    return { ok: true, correct, points };
  }

  tousOntRepondu() {
    const c = this._courante;
    return !!c && this.joueurs.every((j) => c.reponses[j.id] !== undefined);
  }

  // Clôture la manche courante. Renvoie la bonne réponse, les réponses et le classement.
  finirManche() {
    const c = this._courante;
    const p = this._personne(c.personneId);
    return {
      bonneReponse: { id: p.id, nom: p.nom, combo: c.combo },
      reponses: { ...c.reponses },
      scores: this.classement(),
    };
  }

  estFinie() { return this._finie; }

  classement() {
    return this.joueurs
      .map((j) => ({ id: j.id, pseudo: j.pseudo, points: this._scores[j.id] || 0 }))
      .sort((a, b) => b.points - a.points);
  }
}

module.exports = { Beboudle, POINTS_PAR_INDICE, MALUS_FAUX };
