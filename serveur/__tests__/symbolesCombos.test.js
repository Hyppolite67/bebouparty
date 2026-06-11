// serveur/__tests__/symbolesCombos.test.js
const { SYMBOLES, tirerSymbole, detecterCombo } = require('../symbolesCombos');

test('les 6 symboles existent avec des probabilités sommant ~1', () => {
  const cles = Object.keys(SYMBOLES);
  expect(cles).toEqual(expect.arrayContaining(['fusee','etoile','bombe','escargot','bouclier','joker']));
  const somme = cles.reduce((s,k)=>s+SYMBOLES[k].proba,0);
  expect(somme).toBeCloseTo(1, 5);
});

test('tirerSymbole respecte les bornes (rng injecté)', () => {
  expect(tirerSymbole(()=>0)).toBe('fusee');     // tout début de la plage
  expect(tirerSymbole(()=>0.999)).toBe('joker');  // toute fin de la plage
});

test('detecterCombo : combos nommés (ordre indifférent)', () => {
  expect(detecterCombo(['fusee','fusee','fusee']).nom).toBe('TURBO MAX');
  expect(detecterCombo(['fusee','fusee','etoile']).nom).toBe('TURBO');
  expect(detecterCombo(['etoile','fusee','fusee']).nom).toBe('TURBO'); // ordre indifférent
  expect(detecterCombo(['fusee','fusee','bombe']).nom).toBe('BOOST');
  expect(detecterCombo(['etoile','etoile','bombe']).nom).toBe('ÉCLAT');
  expect(detecterCombo(['bombe','bombe','fusee']).nom).toBe('PÉTARD');
  expect(detecterCombo(['escargot','escargot','fusee']).nom).toBe('GADOUE');
  expect(detecterCombo(['bombe','bombe','bombe']).nom).toBe('TRIPLE BOMBE');
  expect(detecterCombo(['escargot','escargot','escargot']).nom).toBe('MALÉDICTION');
  expect(detecterCombo(['bouclier','bouclier','bouclier']).nom).toBe('BOUCLIER TOTAL');
  expect(detecterCombo(['etoile','etoile','etoile']).nom).toBe('CONSTELLATION');
  expect(detecterCombo(['fusee','etoile','joker']).nom).toBe('JACKPOT');
  expect(detecterCombo(['bombe','bombe','joker']).nom).toBe('CHAOS TOTAL');
  expect(detecterCombo(['joker','joker','joker']).nom).toBe('TRIPLE JOKER');
});

test('detecterCombo : aucun combo reconnu → effet neutre', () => {
  const r = detecterCombo(['fusee','bombe','escargot']);
  expect(r.nom).toBe('AUCUN');
});
