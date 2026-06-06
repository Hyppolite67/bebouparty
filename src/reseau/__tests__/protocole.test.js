// src/reseau/__tests__/protocole.test.js
import { construire, parser } from '../protocole';

test('construire produit une chaîne JSON avec le bon type', () => {
  expect(JSON.parse(construire('LANCER_PARTIE'))).toEqual({ type: 'LANCER_PARTIE' });
  expect(JSON.parse(construire('CHOISIR_JEU', { idJeu: 'dessin' }))).toEqual({ type: 'CHOISIR_JEU', idJeu: 'dessin' });
});

test('parser lit un message valide', () => {
  expect(parser('{"type":"SALLE_CREEE","code":"BEBOU-1234"}')).toEqual({ type: 'SALLE_CREEE', code: 'BEBOU-1234' });
});

test('parser renvoie null sur du JSON invalide', () => {
  expect(parser('pas du json')).toBeNull();
});
