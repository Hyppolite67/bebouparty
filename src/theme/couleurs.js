// src/theme/couleurs.js
// Toutes les couleurs de BebouParty au même endroit.
// Pour changer l'ambiance de l'app, on ne touche qu'ici.

export const COULEURS = {
  // Dégradé de fond principal (violet -> rose)
  fondHaut: '#7B2FBE',
  fondMilieu: '#9B2EB0',
  fondBas: '#E91E8C',

  // Accents
  violet: '#8B5CF6',
  violetFonce: '#7C3AED',
  rose: '#EC4899',
  roseFonce: '#DB2777',
  cyan: '#06B6D4',

  // Textes
  blanc: '#FFFFFF',
  jaune: '#FFD700',
  texteDoux: 'rgba(255,255,255,0.8)',

  // Verre (glassmorphism)
  verre: 'rgba(255,255,255,0.15)',
  verreBordure: 'rgba(255,255,255,0.40)',

  // Divers
  ombreNoire: 'rgba(0,0,0,0.18)',
  erreur: '#EF4444',
  verrou: 'rgba(255,255,255,0.25)',
};

// Le dégradé prêt à l'emploi pour expo-linear-gradient
export const DEGRADE_FOND = [COULEURS.fondHaut, COULEURS.fondMilieu, COULEURS.fondBas];
