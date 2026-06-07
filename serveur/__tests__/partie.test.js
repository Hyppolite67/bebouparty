// serveur/__tests__/partie.test.js
const { Partie } = require('../partie');

// On injecte un tireur de mots déterministe pour des tests stables.
const tireurFake = () => ['maison', 'chat', 'soleil'];
function nouvellePartie() {
  const joueurs = [
    { id: 'A', pseudo: 'Léa' }, { id: 'B', pseudo: 'Max' }, { id: 'C', pseudo: 'Sam' },
  ];
  return new Partie(joueurs, { manches: 1, duree: 80 }, { tirerTrois: tireurFake });
}

test('le premier tour propose 3 mots au premier dessinateur', () => {
  const p = nouvellePartie();
  const t = p.demarrerTour();
  expect(t.dessinateurId).toBe('A');
  expect(t.mots).toEqual(['maison', 'chat', 'soleil']);
});

test('choisirMot fixe le mot et renvoie le nb de lettres', () => {
  const p = nouvellePartie(); p.demarrerTour();
  const r = p.choisirMot('maison');
  expect(r.nbLettres).toBe(6);
  expect(r.duree).toBe(80);
});

test('un devineur qui trouve marque des points, le dessinateur aussi', () => {
  const p = nouvellePartie(); p.demarrerTour(); p.choisirMot('maison');
  const r = p.deviner('B', 'MAISON', 80); // tempsRestant = 80
  expect(r.resultat).toBe('exact');
  expect(p.scores().B).toBeGreaterThan(0);
  expect(p.scores().A).toBeGreaterThan(0); // dessinateur récompensé
});

test('le dessinateur ne peut pas deviner', () => {
  const p = nouvellePartie(); p.demarrerTour(); p.choisirMot('maison');
  expect(p.deviner('A', 'maison', 80).resultat).toBe('interdit');
});

test('réponse à une lettre près = proche', () => {
  const p = nouvellePartie(); p.demarrerTour(); p.choisirMot('maison');
  expect(p.deviner('B', 'maisom', 80).resultat).toBe('proche');
});

test('le tour finit quand tous les devineurs ont trouvé', () => {
  const p = nouvellePartie(); p.demarrerTour(); p.choisirMot('maison');
  p.deviner('B', 'maison', 70);
  expect(p.tousOntTrouve()).toBe(false);
  p.deviner('C', 'maison', 60);
  expect(p.tousOntTrouve()).toBe(true);
});

test('plus on trouve tôt, plus on marque', () => {
  const p = nouvellePartie(); p.demarrerTour(); p.choisirMot('maison');
  const tot = p.deviner('B', 'maison', 75).points;
  const tard = p.deviner('C', 'maison', 10).points;
  expect(tot).toBeGreaterThan(tard);
});

test('enchaînement des dessinateurs puis fin de partie avec classement', () => {
  const p = nouvellePartie(); // 3 joueurs, 1 manche → 3 tours
  for (const id of ['A', 'B', 'C']) {
    const t = p.demarrerTour();
    expect(t.dessinateurId).toBe(id);
    p.choisirMot('maison');
    p.finTour();
  }
  expect(p.estFinie()).toBe(true);
  const classement = p.classement();
  expect(classement).toHaveLength(3);
  expect(classement[0].points).toBeGreaterThanOrEqual(classement[1].points);
});

test('si le dessinateur part, le tour se termine', () => {
  const p = nouvellePartie(); p.demarrerTour(); p.choisirMot('maison');
  const r = p.joueurParti('A');
  expect(r.tourTermine).toBe(true);
});
