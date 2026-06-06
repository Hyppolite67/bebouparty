// src/donnees/mascotte.js
// Données PURES des options de mascotte. Réutilisées par le composant Mascotte
// et le sélecteur. Les chemins SVG viennent des maquettes validées.

export const CREATURES = [
  { nom: 'Blob',       d: 'M100 44 C150 44 172 86 166 126 C160 168 134 188 100 188 C66 188 40 168 34 126 C28 86 50 44 100 44Z' },
  { nom: 'Goutte',     d: 'M100 24 C120 70 168 96 166 132 C164 168 134 188 100 188 C66 188 36 168 34 132 C32 96 80 70 100 24Z' },
  { nom: 'Patate',     d: 'M96 46 C140 40 178 74 174 122 C171 162 150 188 100 188 C58 188 26 168 26 124 C26 82 54 52 96 46Z' },
  { nom: 'Haricot',    d: 'M120 44 C166 52 178 104 158 140 C142 170 152 188 110 188 C70 188 40 170 36 132 C32 96 50 92 62 78 C74 64 84 40 120 44Z' },
  { nom: 'Caillou',    d: 'M70 50 L130 46 C168 60 176 96 168 130 C160 170 130 188 96 188 C58 188 30 168 28 128 C26 92 40 62 70 50Z' },
  { nom: 'Méduse',     d: 'M100 46 C146 46 168 84 168 116 C168 132 160 140 150 140 C150 152 158 160 150 170 C144 178 136 168 134 160 C130 176 120 182 116 168 C110 184 96 184 92 168 C86 182 76 178 72 162 C66 174 56 168 56 156 C50 162 44 152 50 140 C40 138 32 130 32 116 C32 84 54 46 100 46Z' },
  { nom: 'Flaque',     d: 'M100 68 C150 68 182 92 182 124 C182 152 168 162 150 164 C152 174 144 180 138 172 C132 182 120 180 118 170 C110 182 96 184 90 170 C82 182 70 178 68 168 C56 174 42 166 48 154 C26 152 18 138 18 122 C18 92 50 68 100 68Z' },
  { nom: 'Œuf bancal', d: 'M110 28 C148 34 164 80 160 128 C156 168 130 188 96 188 C62 188 40 166 42 124 C44 78 72 22 110 28Z' },
  { nom: 'Champi',     d: 'M38 96 C38 54 70 38 100 38 C130 38 162 54 162 96 C162 110 150 114 136 114 L130 180 C130 186 122 188 114 188 L86 188 C78 188 70 186 70 180 L64 114 C50 114 38 110 38 96Z' },
  { nom: 'Oursin',     d: 'M100 44 L108 28 L116 46 L130 32 L130 52 C158 60 172 92 168 124 C162 166 134 188 100 188 C66 188 38 166 32 124 C28 92 42 60 70 52 L70 32 L84 46 L92 28 L100 44Z' },
];

export const COULEURS_MASCOTTE = [
  { nom: 'Violet', valeur: '#9B7BFF' }, { nom: 'Rose', valeur: '#F875B8' },
  { nom: 'Cyan', valeur: '#3DD6E8' },   { nom: 'Jaune', valeur: '#FFD24A' },
  { nom: 'Lime', valeur: '#A3E635' },   { nom: 'Corail', valeur: '#FF8A8A' },
  { nom: 'Orange', valeur: '#FFA94D' }, { nom: 'Bleu', valeur: '#6BA6FF' },
  { nom: 'Lavande', valeur: '#C4B5FD' },{ nom: 'Magenta', valeur: '#F472D0' },
];

// TRONCHES et ACCESSOIRES : chaque option fournit une fonction qui rend des
// éléments react-native-svg. On les définit dans Mascotte.js (besoin des
// composants Svg). Ici on ne garde que les NOMS pour le sélecteur + le total.
export const TRONCHES = [
  { nom: 'Mignon' }, { nom: 'Louche' }, { nom: 'Langue pendante' }, { nom: 'KO (x_x)' },
  { nom: 'Sourcil unique' }, { nom: 'Psychopathe' }, { nom: 'Choqué' }, { nom: "Clin d'œil" },
  { nom: 'Blasé' }, { nom: 'Dents du bonheur' },
];

export const ACCESSOIRES = [
  { nom: 'Aucun' }, { nom: 'Lunettes de fête' }, { nom: 'Couronne' }, { nom: 'Chapeau de fête' },
  { nom: 'Corne licorne' }, { nom: 'Auréole' }, { nom: 'Antennes' }, { nom: 'Bob' },
  { nom: 'Casquette' }, { nom: 'Cocktail' },
];

export function mascotteAleatoire() {
  const r = (n) => Math.floor(Math.random() * n);
  return { creature: r(CREATURES.length), tronche: r(TRONCHES.length), accessoire: r(ACCESSOIRES.length), couleur: r(COULEURS_MASCOTTE.length) };
}

export const MASCOTTE_DEFAUT = { creature: 2, tronche: 2, accessoire: 1, couleur: 4 };
