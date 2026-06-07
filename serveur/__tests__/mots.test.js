// serveur/__tests__/mots.test.js
const { MOTS, tirerTrois } = require('../mots');

test('la liste contient au moins 100 mots', () => {
  expect(MOTS.length).toBeGreaterThanOrEqual(100);
});

test('tirerTrois renvoie 3 mots distincts de la liste', () => {
  const t = tirerTrois();
  expect(t).toHaveLength(3);
  expect(new Set(t).size).toBe(3);
  t.forEach((m) => expect(MOTS).toContain(m));
});

test('tirerTrois évite les mots déjà utilisés si possible', () => {
  const exclus = new Set(MOTS.slice(0, MOTS.length - 3));
  const t = tirerTrois(exclus);
  t.forEach((m) => expect(exclus.has(m)).toBe(false));
});
