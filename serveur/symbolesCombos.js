// serveur/symbolesCombos.js
// Symboles, probabilités de tirage, et détection du combo à partir de 3 symboles.

const SYMBOLES = {
  fusee:    { emoji: '🚀', proba: 0.20 },
  etoile:   { emoji: '⭐', proba: 0.20 },
  bombe:    { emoji: '💣', proba: 0.18 },
  escargot: { emoji: '🐌', proba: 0.18 },
  bouclier: { emoji: '🛡️', proba: 0.12 },
  joker:    { emoji: '🃏', proba: 0.12 },
};

// Tire un symbole selon les probabilités. rng() ∈ [0,1) (injectable pour les tests).
function tirerSymbole(rng = Math.random) {
  const r = rng();
  let cumul = 0;
  for (const cle of Object.keys(SYMBOLES)) {
    cumul += SYMBOLES[cle].proba;
    if (r < cumul) return cle;
  }
  return 'joker'; // filet de sécurité
}

// Compte les occurrences de chaque symbole.
function compter(symboles) {
  const c = {};
  for (const s of symboles) c[s] = (c[s] || 0) + 1;
  return c;
}

// Détermine le combo. Renvoie { nom, effet } où effet décrit l'action (voir turbo.js).
// L'ordre des symboles n'a pas d'importance.
function detecterCombo(symboles) {
  const c = compter(symboles);
  const a = (s) => c[s] || 0;
  const triple = (s) => a(s) === 3;
  const paire = (s) => a(s) >= 2;
  const contient = (s) => a(s) >= 1;

  // --- TRÈS RARES d'abord ---
  if (a('fusee') === 1 && a('etoile') === 1 && a('joker') === 1) return combo('JACKPOT', { soi: +4, leader: -2 });
  if (paire('bombe') && contient('joker')) return combo('CHAOS TOTAL', { adversaires: -2 });
  if (triple('joker')) return combo('TRIPLE JOKER', { echangeLeader: true });

  // --- RARES (3 identiques + spéciaux) ---
  if (triple('fusee')) return combo('TURBO MAX', { soi: +3 });
  if (triple('bombe')) return combo('TRIPLE BOMBE', { adversaires: -1 });
  if (triple('escargot')) return combo('MALÉDICTION', { malediction: true });
  if (triple('bouclier')) return combo('BOUCLIER TOTAL', { bouclier: true });
  if (triple('etoile')) return combo('CONSTELLATION', { soi: +2, voleDevant: 1 });

  // --- FRÉQUENTS ---
  if (paire('fusee') && contient('etoile')) return combo('TURBO', { soi: +2 });
  if (paire('bombe')) return combo('PÉTARD', { devant: -1 });
  if (paire('escargot')) return combo('GADOUE', { soi: -1 });

  // --- TRÈS FRÉQUENTS ---
  if (paire('fusee')) return combo('BOOST', { soi: +1 });
  if (paire('etoile')) return combo('ÉCLAT', { soi: +1 });

  return combo('AUCUN', { soi: 0 });
}

function combo(nom, effet) { return { nom, effet }; }

module.exports = { SYMBOLES, tirerSymbole, detecterCombo, compter };
