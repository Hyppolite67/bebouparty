// serveur/__tests__/turbo.test.js
const { CourseTurbo } = require('../turbo');

function course() {
  const joueurs = [
    { id:'A', pseudo:'Léa' }, { id:'B', pseudo:'Max' }, { id:'C', pseudo:'Sam' },
  ];
  return new CourseTurbo(joueurs, { duree: 60, longueur: 20 });
}

test('BOOST avance le joueur de 1', () => {
  const c = course();
  c.appliquerTicket('A', ['fusee','fusee','bombe'], 0);
  expect(c.positions().A).toBe(1);
});

test('on ne descend jamais sous 0', () => {
  const c = course();
  c.appliquerTicket('A', ['escargot','escargot','fusee'], 0); // GADOUE -1
  expect(c.positions().A).toBe(0);
});

test('PÉTARD fait reculer le joueur DEVANT', () => {
  const c = course();
  c.appliquerTicket('B', ['fusee','fusee','fusee'], 0); // B à 3 (leader/devant)
  c.appliquerTicket('A', ['bombe','bombe','fusee'], 0); // A pète → B (devant) recule de 1
  expect(c.positions().B).toBe(2);
});

// Le bouclier actif annule le prochain _reculer reçu et se consomme.
// Ici : A prend un bouclier, puis C lance TRIPLE BOMBE (adversaires -1).
// A est protégé → son bouclier se consomme (false), sa position reste à 0.
test('le bouclier annule le prochain effet négatif', () => {
  const c = course();
  c.appliquerTicket('A', ['bouclier','bouclier','bouclier'], 0); // A bouclier
  c.appliquerTicket('B', ['fusee','fusee','fusee'], 0);          // B avance à 3
  c.appliquerTicket('B', ['bombe','bombe','fusee'], 0);          // B pète → devant B = personne (B est leader) → aucun effet
  // Pour tester le bouclier sur A, on vise A directement via TRIPLE BOMBE (tous adversaires -1)
  c.appliquerTicket('C', ['bombe','bombe','bombe'], 0);          // tous adversaires -1, A protégé
  expect(c.boucliers().A).toBe(false); // bouclier consommé
  expect(c.positions().A).toBe(0);     // position inchangée (protégé)
});

test('Joker quand on est leader → +2 au lieu de l\'effet joker', () => {
  const c = course();
  c.appliquerTicket('A', ['fusee','fusee','fusee'], 0); // A=3, leader
  const av = c.positions().A;
  c.appliquerTicket('A', ['joker','joker','joker'], 0); // TRIPLE JOKER, mais A est leader → +2
  expect(c.positions().A).toBe(av + 2);
});

test('un recul ne dépasse jamais 3 cases', () => {
  const c = course();
  // place A loin puis applique un effet hypothétique fort ; la règle plafonne à -3
  for (let i=0;i<5;i++) c.appliquerTicket('A', ['fusee','fusee','fusee'], 0); // A monte
  const avant = c.positions().A;
  c._reculer('A', 10); // helper interne plafonné à 3
  expect(avant - c.positions().A).toBeLessThanOrEqual(3);
});

test('la malédiction réduit les gains pendant 10 s et ne se cumule pas', () => {
  const c = course();
  c.appliquerTicket('A', ['escargot','escargot','escargot'], 1000); // malédiction à t=1s
  c.appliquerTicket('A', ['fusee','fusee','bombe'], 2000); // BOOST +1, mais maudit → +0
  expect(c.positions().A).toBe(0);
  c.appliquerTicket('A', ['fusee','fusee','bombe'], 12000); // >10s plus tard, malédiction finie → +1
  expect(c.positions().A).toBe(1);
});

test('fin de course si un kart atteint la longueur, classement + points', () => {
  const c = course();
  for (let i=0;i<7;i++) c.appliquerTicket('A', ['fusee','fusee','fusee'], 0); // 7*3=21 ≥ 20
  expect(c.estFinie(0)).toBe(true);
  const cl = c.classement();
  expect(cl[0].id).toBe('A');
  expect(cl[0].points).toBe(500);
  expect(cl[1].points).toBe(300);
});

test('fin de course si le timer est écoulé', () => {
  const c = course();
  expect(c.estFinie(59000)).toBe(false);
  expect(c.estFinie(60000)).toBe(true);
});
