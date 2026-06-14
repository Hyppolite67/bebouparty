// src/donnees/__tests__/personnes.test.js
import { combosJouables, PERSONNES_DEFAUT, nouvelId } from '../personnes';

test('PERSONNES_DEFAUT contient Lucas S (3 combos) et Lucas Tutin (1)', () => {
  const ls = PERSONNES_DEFAUT.find((p) => p.nom === 'Lucas S');
  const lt = PERSONNES_DEFAUT.find((p) => p.nom === 'Lucas Tutin');
  expect(ls.combos).toHaveLength(3);
  expect(lt.combos).toHaveLength(1);
});

test('combosJouables ne compte que les combos de 4 emojis', () => {
  const data = [
    { id: 'x', nom: 'X', combos: [['a', 'b', 'c', 'd'], ['a', 'b']] },
    { id: 'y', nom: 'Y', combos: [] },
  ];
  expect(combosJouables(data)).toBe(1);
});

test('nouvelId produit un identifiant slugifié non vide', () => {
  expect(nouvelId('Jean Mi')).toMatch(/^jean-mi-/);
  expect(nouvelId('')).toMatch(/^p-/);
});
