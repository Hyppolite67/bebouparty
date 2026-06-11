// serveur/turbo.js
// Moteur de course Turbo Jackpot : positions, effets, règles d'équilibre, fin, score.
// Logique pure — pas de setTimeout ; le timer est géré par serveur.js.

const { detecterCombo } = require('./symbolesCombos');

const RECUL_MAX = 3;
const DUREE_MALEDICTION = 10000; // 10 secondes en ms

class CourseTurbo {
  constructor(joueurs, { duree = 60, longueur = 20 } = {}) {
    this.joueurs = joueurs;
    this.duree = duree;          // durée en secondes
    this.longueur = longueur;    // case d'arrivée (piste 20 cases)
    this._pos = Object.fromEntries(joueurs.map(j => [j.id, 0]));
    this._bouclier = Object.fromEntries(joueurs.map(j => [j.id, false]));
    this._maledictionFin = Object.fromEntries(joueurs.map(j => [j.id, 0])); // timestamp ms de fin
    this._fini = false;
  }

  // Accesseurs (copie défensive)
  positions() { return { ...this._pos }; }
  boucliers() { return { ...this._bouclier }; }

  // Le joueur ayant la position la plus haute (le premier en cas d'égalité : premier dans la liste).
  _leader() {
    return this.joueurs
      .map(j => j.id)
      .reduce((meilleur, id) => (this._pos[id] > this._pos[meilleur] ? id : meilleur));
  }

  // Joueur immédiatement DEVANT `id` (position juste supérieure la plus proche). null si personne.
  _devant(id) {
    const moi = this._pos[id];
    let cible = null;
    for (const j of this.joueurs) {
      if (j.id === id) continue;
      if (this._pos[j.id] > moi && (cible === null || this._pos[j.id] < this._pos[cible])) {
        cible = j.id;
      }
    }
    return cible;
  }

  // Avancer : position plafonnée à la longueur de piste.
  _avancer(id, n) {
    this._pos[id] = Math.min(this.longueur, this._pos[id] + n);
  }

  // Reculer : bouclier absorbe le premier effet négatif, recul plafonné à RECUL_MAX, position min 0.
  _reculer(id, n) {
    if (this._bouclier[id]) {
      // Le bouclier annule cet effet négatif et se consomme.
      this._bouclier[id] = false;
      return;
    }
    const recul = Math.min(RECUL_MAX, n);
    this._pos[id] = Math.max(0, this._pos[id] - recul);
  }

  // Vrai si le joueur est sous malédiction active à l'instant t.
  _estMaudit(id, t) {
    return this._maledictionFin[id] > t;
  }

  // Applique un ticket terminé. Renvoie { combo, effets, feed }.
  appliquerTicket(joueurId, symboles, t = Date.now()) {
    if (this._fini) return { combo: 'AUCUN', effets: [], feed: null };

    let { nom, effet } = detecterCombo(symboles);
    const effets = [];

    // Règle Joker-leader : TRIPLE JOKER → +2 cases si on est déjà le leader.
    if (nom === 'TRIPLE JOKER' && this._leader() === joueurId) {
      effet = { soi: +2 };
      nom = 'JOKER (+2)';
    }

    // Gain/recul sur soi-même.
    if (typeof effet.soi === 'number') {
      let g = effet.soi;
      // Malédiction : les gains positifs sont réduits de 1 (minimum 0).
      if (g > 0 && this._estMaudit(joueurId, t)) g = Math.max(0, g - 1);
      if (g > 0) {
        this._avancer(joueurId, g);
        effets.push({ joueurId, type: 'boost' });
      } else if (g < 0) {
        this._reculer(joueurId, -g);
        effets.push({ joueurId, type: 'recule' });
      }
    }

    // PÉTARD : le joueur directement devant recule de 1.
    if (effet.devant === -1) {
      const d = this._devant(joueurId);
      if (d) {
        this._reculer(d, 1);
        effets.push({ joueurId: d, type: 'recule' });
      }
    }

    // TRIPLE BOMBE / CHAOS TOTAL : tous les adversaires reculent.
    if (typeof effet.adversaires === 'number') {
      for (const j of this.joueurs) {
        if (j.id !== joueurId) {
          this._reculer(j.id, -effet.adversaires); // adversaires est négatif
          effets.push({ joueurId: j.id, type: 'recule' });
        }
      }
    }

    // JACKPOT : le leader recule de 2 (si ce n'est pas soi-même).
    if (effet.leader === -2) {
      const l = this._leader();
      if (l !== joueurId) {
        this._reculer(l, 2);
        effets.push({ joueurId: l, type: 'recule' });
      }
    }

    // CONSTELLATION : vole 1 case au joueur devant soi.
    if (effet.voleDevant) {
      const d = this._devant(joueurId);
      if (d && this._pos[d] > 0) {
        this._pos[d] -= 1;
        this._avancer(joueurId, 1);
        effets.push({ joueurId: d, type: 'recule' });
      }
    }

    // BOUCLIER TOTAL : active le bouclier pour soi.
    if (effet.bouclier) {
      this._bouclier[joueurId] = true;
      effets.push({ joueurId, type: 'bouclier' });
    }

    // MALÉDICTION : démarre la malédiction si non déjà active (non cumulable).
    if (effet.malediction) {
      if (!this._estMaudit(joueurId, t)) {
        this._maledictionFin[joueurId] = t + DUREE_MALEDICTION;
      }
      effets.push({ joueurId, type: 'ralenti' });
    }

    // TRIPLE JOKER : échange de position avec le leader (si ce n'est pas soi-même).
    if (effet.echangeLeader) {
      const l = this._leader();
      if (l !== joueurId) {
        const tmp = this._pos[l];
        this._pos[l] = this._pos[joueurId];
        this._pos[joueurId] = tmp;
        effets.push({ joueurId, type: 'echange' }, { joueurId: l, type: 'echange' });
      }
    }

    return {
      combo: nom,
      effets,
      feed: { message: this._messageFeed(joueurId, nom), ton: this._ton(nom) },
    };
  }

  _pseudo(id) {
    return (this.joueurs.find(j => j.id === id) || {}).pseudo || '?';
  }

  _messageFeed(id, nom) {
    return `${this._pseudo(id)} → ${nom}`;
  }

  _ton(nom) {
    if (['GADOUE', 'MALÉDICTION'].includes(nom)) return 'bleu';
    if (['PÉTARD', 'TRIPLE BOMBE', 'CHAOS TOTAL'].includes(nom)) return 'rouge';
    if (['JACKPOT', 'TURBO MAX', 'TRIPLE JOKER', 'JOKER (+2)', 'CONSTELLATION'].includes(nom)) return 'dore';
    return 'vert';
  }

  // Vrai si la course est terminée (timer écoulé ou un kart à l'arrivée).
  estFinie(t) {
    if (this._fini) return true;
    if (t >= this.duree * 1000) { this._fini = true; return true; }
    if (Object.values(this._pos).some(p => p >= this.longueur)) { this._fini = true; return true; }
    return false;
  }

  // Classement trié par position décroissante. Points : 500/300/150/50.
  classement() {
    const tries = [...this.joueurs].sort((a, b) => this._pos[b.id] - this._pos[a.id]);
    const pts = [500, 300, 150];
    return tries.map((j, i) => ({
      id: j.id,
      pseudo: j.pseudo,
      position: this._pos[j.id],
      points: pts[i] != null ? pts[i] : 50,
    }));
  }
}

module.exports = { CourseTurbo };
