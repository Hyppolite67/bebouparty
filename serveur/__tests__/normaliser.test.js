// serveur/__tests__/normaliser.test.js
const { normaliser, estProche } = require('../normaliser');

test('normaliser enlève accents, casse et espaces superflus', () => {
  expect(normaliser('  Éléphant ')).toBe('elephant');
  expect(normaliser('CRÊPE')).toBe('crepe');
  expect(normaliser('un  chat')).toBe('un chat');
});

test('estProche : vrai si une seule lettre diffère', () => {
  expect(estProche('maison', 'maisom')).toBe(true);   // substitution (distance 1)
  expect(estProche('chat', 'chats')).toBe(true);       // ajout (distance 1)
  // 'chein' est une transposition de 'chien' (e<->i) : distance Levenshtein = 2 → false
  expect(estProche('chien', 'chein')).toBe(false);
  expect(estProche('maison', 'voiture')).toBe(false);
  expect(estProche('maison', 'maison')).toBe(false);   // identique n'est pas "proche"
});
