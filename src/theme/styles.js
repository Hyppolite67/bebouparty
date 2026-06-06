// src/theme/styles.js
// Helpers de style réutilisés partout : coins arrondis et ombres colorées.
import { COULEURS } from './couleurs';

export const RAYONS = { carte: 24, bouton: 22, petit: 14 };

// Fabrique une ombre portée COLORÉE (pas grise) à partir d'une couleur.
export function ombreColoree(couleur) {
  return {
    shadowColor: couleur,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10, // Android
  };
}

export const POLICES = {
  titre: 'Baloo2_800ExtraBold',
  titreMoyen: 'Baloo2_700Bold',
  texte: 'Fredoka_500Medium',
  texteGras: 'Fredoka_600SemiBold',
};
