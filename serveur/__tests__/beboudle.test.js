// serveur/__tests__/beboudle.test.js
const { Beboudle } = require('../beboudle');

const joueurs = [{ id: 'A', pseudo: 'Léa' }, { id: 'B', pseudo: 'Max' }];
const personnes = [
  { id: 'lucas-s', nom: 'Lucas S', combos: [['🏃', '👟', '😆', '🍺'], ['🤫', '🎯', '🍺', '🤏']] },
  { id: 'tutin', nom: 'Lucas Tutin', combos: [['🤓', '🟢', '⚽', '⚪']] },
  { id: 'alex', nom: 'Alex', combos: [] },
  { id: 'wawan', nom: 'Wawan', combos: [] },
  { id: 'nathan', nom: 'Nathan', combos: [] },
  { id: 'charlelie', nom: 'Charlélie', combos: [] },
];
const sansMelange = { melanger: (a) => a.slice() }; // déterministe

test('le nombre de manches est plafonné au nombre de combos remplis', () => {
  const jeu = new Beboudle(joueurs, { personnes, manches: 10 }, sansMelange);
  // 3 combos remplis au total (2 + 1)
  let n = 0;
  while (jeu.demarrerManche()) { jeu.finirManche(); n++; }
  expect(n).toBe(3);
});

test('points décroissants selon l’indice révélé', () => {
  const jeu = new Beboudle(joueurs, { personnes, manches: 10 }, sansMelange);
  jeu.demarrerManche(); // indice 1
  const bon = jeu._courante.personneId;
  expect(jeu.repondre('A', bon)).toEqual({ ok: true, correct: true, points: 500 });
  jeu.revelerProchain(); // indice 2
  expect(jeu.repondre('B', bon).points).toBe(300);
});

test('mauvaise réponse = -100 et une seule réponse par joueur', () => {
  const jeu = new Beboudle(joueurs, { personnes, manches: 10 }, sansMelange);
  jeu.demarrerManche();
  const mauvais = jeu._courante.choix.find((c) => c.id !== jeu._courante.personneId).id;
  expect(jeu.repondre('A', mauvais)).toEqual({ ok: true, correct: false, points: -100 });
  expect(jeu.repondre('A', mauvais)).toEqual({ ok: false }); // déjà répondu
});

test('6 choix dont la bonne personne, prénoms distincts', () => {
  const jeu = new Beboudle(joueurs, { personnes, manches: 10 }, sansMelange);
  const { choix } = jeu.demarrerManche();
  expect(choix).toHaveLength(6);
  const ids = choix.map((c) => c.id);
  expect(new Set(ids).size).toBe(6);
  expect(ids).toContain(jeu._courante.personneId);
});

test('revelerProchain plafonne à 4 indices', () => {
  const jeu = new Beboudle(joueurs, { personnes, manches: 10 }, sansMelange);
  jeu.demarrerManche();
  expect(jeu.revelerProchain().indice).toBe(2);
  expect(jeu.revelerProchain().indice).toBe(3);
  expect(jeu.revelerProchain().indice).toBe(4);
  expect(jeu.revelerProchain()).toBeNull();
});

test('finirManche renvoie bonne réponse, réponses et scores ; estFinie après la dernière', () => {
  const jeu = new Beboudle(joueurs, { personnes, manches: 1 }, sansMelange);
  jeu.demarrerManche();
  jeu.repondre('A', jeu._courante.personneId);
  const fin = jeu.finirManche();
  expect(fin.bonneReponse.combo).toHaveLength(4);
  expect(fin.scores[0].points).toBeGreaterThan(0);
  expect(jeu.demarrerManche()).toBeNull();
  expect(jeu.estFinie()).toBe(true);
});
