// serveur/normaliser.js
// Normalise une réponse pour la comparaison (minuscule, sans accents, espaces réduits).
function normaliser(texte) {
  return (texte || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève les diacritiques (accents)
    .replace(/\s+/g, ' ')
    .trim();
}

// Distance de Levenshtein entre deux chaînes.
function distance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[m][n];
}

// "Tout proche" = exactement 1 caractère de différence (après normalisation).
// Distance de Levenshtein === 1 uniquement (la règle retenue — simple et documentée).
function estProche(reponse, mot) {
  return distance(normaliser(reponse), normaliser(mot)) === 1;
}

module.exports = { normaliser, estProche, distance };
