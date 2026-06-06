// src/donnees/__tests__/mascotte.test.js
import { CREATURES, TRONCHES, ACCESSOIRES, COULEURS_MASCOTTE, mascotteAleatoire } from '../mascotte';

test('chaque axe propose 10 options', () => {
  expect(CREATURES).toHaveLength(10);
  expect(TRONCHES).toHaveLength(10);
  expect(ACCESSOIRES).toHaveLength(10);
  expect(COULEURS_MASCOTTE).toHaveLength(10);
});

test('chaque créature a un nom et un chemin SVG', () => {
  for (const c of CREATURES) {
    expect(typeof c.nom).toBe('string');
    expect(typeof c.d).toBe('string');
  }
});

test('mascotteAleatoire renvoie des indices valides', () => {
  const m = mascotteAleatoire();
  expect(m.creature).toBeGreaterThanOrEqual(0);
  expect(m.creature).toBeLessThan(10);
  expect(m).toHaveProperty('tronche');
  expect(m).toHaveProperty('accessoire');
  expect(m).toHaveProperty('couleur');
});
