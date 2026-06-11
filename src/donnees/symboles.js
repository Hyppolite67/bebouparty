// src/donnees/symboles.js
// Symboles, probabilités de tirage et table d'AFFICHAGE des combos — côté app.
// Les mêmes probas et noms de combos que le serveur (symbolesCombos.js / turbo.js).
// Le serveur reste l'autorité sur les positions ; ce fichier sert uniquement à
// afficher les emojis corrects et le texte de la bannière localement.

// Mapping clé → emoji (pour afficher chaque case du ticket).
export const SYMBOLES = {
  fusee:    '🚀',
  etoile:   '⭐',
  bombe:    '💣',
  escargot: '🐌',
  bouclier: '🛡️',
  joker:    '🃏',
};

// Probabilités cumulatives — identiques au serveur.
const PROBAS = [
  { cle: 'fusee',    proba: 0.20 },
  { cle: 'etoile',   proba: 0.20 },
  { cle: 'bombe',    proba: 0.18 },
  { cle: 'escargot', proba: 0.18 },
  { cle: 'bouclier', proba: 0.12 },
  { cle: 'joker',    proba: 0.12 },
];

// Tire une clé de symbole selon les mêmes probabilités que le serveur.
export function tirerSymbole() {
  const r = Math.random();
  let cumul = 0;
  for (const { cle, proba } of PROBAS) {
    cumul += proba;
    if (r < cumul) return cle;
  }
  return 'joker'; // filet de sécurité
}

// Compte les occurrences de chaque symbole dans un tableau de 3 clés.
function compter(symboles) {
  const c = {};
  for (const s of symboles) c[s] = (c[s] || 0) + 1;
  return c;
}

// decrireCombo(symboles) — renvoie { nom, description, ton, icone } pour la bannière.
// Table alignée sur le serveur (même ordre de priorité que detecterCombo).
// ton ∈ 'vert' | 'rouge' | 'bleu' | 'dore'
export function decrireCombo(symboles) {
  const c = compter(symboles);
  const a = (s) => c[s] || 0;
  const triple   = (s) => a(s) === 3;
  const paire    = (s) => a(s) >= 2;
  const contient = (s) => a(s) >= 1;

  // --- TRÈS RARES d'abord (même ordre que le serveur) ---
  if (a('fusee') === 1 && a('etoile') === 1 && a('joker') === 1)
    return desc('JACKPOT',       'Tu avances de 4 cases, le leader recule !', 'dore', '🏆');
  if (paire('bombe') && contient('joker'))
    return desc('CHAOS TOTAL',   'Tous les adversaires reculent de 2 !',      'rouge', '💥');
  if (triple('joker'))
    return desc('TRIPLE JOKER',  'Tu échanges ta place avec le leader !',     'dore', '🌀');

  // --- RARES ---
  if (triple('fusee'))
    return desc('TURBO MAX',     'Tu avances de 3 cases !',                   'dore', '🚀');
  if (triple('bombe'))
    return desc('TRIPLE BOMBE',  'Tous les adversaires reculent !',           'rouge', '💣');
  if (triple('escargot'))
    return desc('MALÉDICTION',   'Tes gains sont réduits pendant 10 s…',      'bleu', '🐌');
  if (triple('bouclier'))
    return desc('BOUCLIER TOTAL','Ton prochain effet négatif est annulé !',   'vert', '🛡️');
  if (triple('etoile'))
    return desc('CONSTELLATION', 'Tu avances de 2 et voles 1 case devant !', 'dore', '⭐');

  // --- FRÉQUENTS ---
  if (paire('fusee') && contient('etoile'))
    return desc('TURBO',         'Tu avances de 2 cases !',                   'vert', '🚀');
  if (paire('bombe'))
    return desc('PÉTARD',        'Le joueur devant toi recule !',             'rouge', '💥');
  if (paire('escargot'))
    return desc('GADOUE',        'Tu recules d\'une case…',                   'bleu', '🐌');

  // --- TRÈS FRÉQUENTS ---
  if (paire('fusee'))
    return desc('BOOST',         'Tu avances d\'une case !',                  'vert', '🚀');
  if (paire('etoile'))
    return desc('ÉCLAT',         'Tu avances d\'une case !',                  'vert', '⭐');

  // Aucun combo reconnu
  return desc('AUCUN',           'Pas de combo…',                             'bleu', '😶');
}

function desc(nom, description, ton, icone) {
  return { nom, description, ton, icone };
}
