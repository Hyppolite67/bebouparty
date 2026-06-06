// serveur/__tests__/salles.test.js
const { GestionnaireSalles } = require('../salles');

test('creerSalle génère un code BEBOU-XXXX et ajoute l\'hôte', () => {
  const g = new GestionnaireSalles();
  const { code, joueur } = g.creerSalle('sock1', { pseudo: 'Léa', mascotte: {} });
  expect(code).toMatch(/^BEBOU-\d{4}$/);
  expect(joueur.estHote).toBe(true);
  expect(g.listeJoueurs(code)).toHaveLength(1);
});

test('rejoindreSalle ajoute un joueur non-hôte', () => {
  const g = new GestionnaireSalles();
  const { code } = g.creerSalle('sock1', { pseudo: 'Léa', mascotte: {} });
  const r = g.rejoindreSalle('sock2', code, { pseudo: 'Max', mascotte: {} });
  expect(r.ok).toBe(true);
  expect(g.listeJoueurs(code)).toHaveLength(2);
  expect(g.listeJoueurs(code)[1].estHote).toBe(false);
});

test('rejoindre un code inconnu échoue proprement', () => {
  const g = new GestionnaireSalles();
  const r = g.rejoindreSalle('sock2', 'BEBOU-0000', { pseudo: 'Max', mascotte: {} });
  expect(r.ok).toBe(false);
  expect(r.code).toBe('SALLE_INTROUVABLE');
});

test('retirer un joueur le sort de la liste', () => {
  const g = new GestionnaireSalles();
  const { code } = g.creerSalle('sock1', { pseudo: 'Léa', mascotte: {} });
  g.rejoindreSalle('sock2', code, { pseudo: 'Max', mascotte: {} });
  g.retirer('sock2');
  expect(g.listeJoueurs(code)).toHaveLength(1);
});

test('estHote indique si un socket est l\'hôte de sa salle', () => {
  const g = new GestionnaireSalles();
  const { code } = g.creerSalle('sock1', { pseudo: 'Léa', mascotte: {} });
  expect(g.estHote('sock1')).toBe(true);
  g.rejoindreSalle('sock2', code, { pseudo: 'Max', mascotte: {} });
  expect(g.estHote('sock2')).toBe(false);
});
