// src/donnees/personnes.js
// Base de personnes du mini-jeu Beboudle, persistée en local sur l'hôte (AsyncStorage).
// Emojis affichés en texte natif (pas de lib). Voir mémoire « beboudle-emojis ».
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLE = 'bebouparty.personnes';

// id stable + prénom + liste de combos (chaque combo = 4 emojis).
export const PERSONNES_DEFAUT = [
  { id: 'lucas-s', nom: 'Lucas S', combos: [
    ['🏃‍♂️', '👟', '😆', '🍺'],
    ['🤫', '🎯', '🍺', '🤏'],
    ['🙏', '👩', '🔞', '💘'],
  ] },
  { id: 'lucas-tutin', nom: 'Lucas Tutin', combos: [['🤓', '🟢', '⚽️', '⚪️']] },
  { id: 'alex', nom: 'Alex', combos: [] },
  { id: 'simon-c', nom: 'Simon C', combos: [] },
  { id: 'simon-kit', nom: 'Simon Kit', combos: [] },
  { id: 'simon-rousseau', nom: 'Simon Rousseau', combos: [] },
  { id: 'maxime', nom: 'Maxime', combos: [] },
  { id: 'wawan', nom: 'Wawan', combos: [] },
  { id: 'nathan', nom: 'Nathan', combos: [] },
  { id: 'charlelie', nom: 'Charlélie', combos: [] },
  { id: 'la-tang', nom: 'La Tang', combos: [] },
];

// Nombre de combos jouables (exactement 4 emojis) dans une base.
export function combosJouables(personnes) {
  return personnes.reduce(
    (n, p) => n + (p.combos || []).filter((c) => Array.isArray(c) && c.length === 4).length,
    0,
  );
}

// Charge la base depuis AsyncStorage ; seed avec la base par défaut si vide.
export async function chargerPersonnes() {
  try {
    const txt = await AsyncStorage.getItem(CLE);
    if (txt) return JSON.parse(txt);
  } catch (e) { /* ignore → seed */ }
  await sauverPersonnes(PERSONNES_DEFAUT);
  return PERSONNES_DEFAUT;
}

export async function sauverPersonnes(personnes) {
  try { await AsyncStorage.setItem(CLE, JSON.stringify(personnes)); } catch (e) {}
}

// Génère un id simple pour une nouvelle personne.
export function nouvelId(nom) {
  const base = (nom || 'p').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (base || 'p') + '-' + Date.now().toString(36);
}
