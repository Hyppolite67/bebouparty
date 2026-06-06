// src/reseau/protocole.js
// Fonctions pures pour fabriquer et lire les messages réseau (JSON).
export function construire(type, donnees = {}) {
  return JSON.stringify({ type, ...donnees });
}
export function parser(texte) {
  try { return JSON.parse(texte); } catch { return null; }
}
