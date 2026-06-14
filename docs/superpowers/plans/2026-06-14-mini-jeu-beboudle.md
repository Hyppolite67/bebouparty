# Beboudle — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le mini-jeu « Beboudle » (deviner une personne via 4 emojis révélés) en réutilisant exactement le système réseau de « Dessine-moi ».

**Architecture:** Serveur autoritaire — une classe pure `Beboudle` (testée en TDD, comme `serveur/partie.js`) câblée dans `serveur/serveur.js` avec des timers pour la révélation des indices. Le client est piloté par événements via `src/reseau/ClientReseau.js` (avec replay anti-course). La base de personnes vit en AsyncStorage sur l'hôte et est envoyée au serveur au lancement. Mode créateur = écran admin local hors réseau.

**Tech Stack:** Node `ws` (serveur), Jest (jest-expo), React Native/Expo SDK 54, react-native-reanimated 4, AsyncStorage, WebSocket natif. **Emojis en `<Text>` natif** (pas de lib).

**Conventions du repo (à respecter) :**
- Logique de jeu = classe pure, **aucun `setTimeout`** dedans (les timers sont dans `serveur.js`). Réf : `serveur/turbo.js`, `serveur/partie.js`.
- Tout le tactile en `PanResponder` (pas de gesture-handler). Ici peu de tactile (boutons `Pressable`).
- Commits fréquents en français, terminés par la ligne `Co-Authored-By:` habituelle.
- Lancer les tests serveur : `cd serveur && npm test`. Tests app : `npm test` à la racine.

---

## Structure des fichiers

**Créés :**
- `serveur/beboudle.js` — classe pure `Beboudle` (manches, indices, points, fin, classement).
- `serveur/__tests__/beboudle.test.js` — tests TDD de la classe.
- `src/donnees/personnes.js` — seed par défaut + helpers AsyncStorage (charger/sauver) + helpers de tirage côté affichage.
- `src/donnees/__tests__/personnes.test.js` — tests des helpers purs (tirage distracteurs, combos jouables).
- `src/ecrans/EcranBeboudle.js` — orchestrateur de l'écran de jeu.
- `src/ecrans/EcranCreateur.js` — mode créateur (CRUD AsyncStorage).
- `src/composants/beboudle/CaseEmoji.js` — une case emoji (révélation pop/flash/particules ou « ? »).
- `src/composants/beboudle/BoutonPersonne.js` — un bouton prénom (états normal/choisi/bon/mauvais).
- `src/composants/beboudle/ScoresManche.js` — overlay scores intermédiaires (podium animé).
- `src/composants/beboudle/TimerIndice.js` — barre de timer qui se vide (orange→rouge).

**Modifiés :**
- `serveur/serveur.js` — brancher `idJeu === 'beboudle'` + timers de révélation + handler `REPONDRE`.
- `src/reseau/protocole.js` — inchangé (générique) ; rien à faire normalement.
- `src/reseau/ClientReseau.js` — nouveaux events + fonctions `repondre`, replay anti-course.
- `src/ecrans/EcranSelectionJeu.js` — déverrouiller la carte Beboudle + routage navigation.
- `src/navigation/Navigation.js` — enregistrer `Beboudle` et `Createur`.
- `src/ecrans/EcranAccueil.js` — bouton discret ✏️ + porte code `7285` vers `Createur`.

---

## Phase A — Logique serveur `Beboudle` (TDD)

**Files:**
- Create: `serveur/beboudle.js`
- Test: `serveur/__tests__/beboudle.test.js`

Modèle mental : la classe possède l'état d'une partie multi-manches. `serveur.js` appelle `demarrerManche()`, puis `revelerProchain()` à chaque tick de 15 s, encaisse les réponses via `repondre()`, et clôt avec `finirManche()`.

API publique visée :
```js
new Beboudle(joueurs, { personnes, manches = 10 }, deps = {})
// joueurs : [{ id, pseudo, mascotte? }]
// personnes : [{ id, nom, combos: [[e1,e2,e3,e4], ...] }]  (combos vides tolérés)
// deps.melanger : fn(array)->array  (injectable pour tests déterministes)

demarrerManche()      // -> { manche, total, choix:[{id,nom}] } | null si fini
emoji(i)              // -> emoji i (0..3) de la manche courante (usage serveur, broadcast 1 par 1)
revelerProchain()     // -> { indice, emoji } (indice 1-based, max 4) | null si déjà 4
repondre(joueurId, personneId) // -> { ok:true, correct:bool, points } | { ok:false }
tousOntRepondu()      // -> bool
finirManche()         // -> { bonneReponse:{id,nom,combo}, reponses:{jid:pid}, scores:[{id,pseudo,points}] }
estFinie()            // -> bool (toutes les manches jouées)
classement()          // -> [{id,pseudo,points}] trié desc
```

Règles clés :
- Construction des manches : aplatir tous les couples (personneId, combo) où `combo.length === 4` ; mélanger ; garder `min(manches, dispo)`. Un même combo n'est joué qu'une fois.
- `choix` d'une manche : la bonne personne + 5 autres personnes distinctes (tirées dans toute la base, prénoms uniques), le tout mélangé. Plafonné si < 6 personnes.
- Points : indice 1→500, 2→300, 3→150, 4→50 ; mauvaise réponse → −100. Une seule réponse par joueur/manche (`repondre` renvoie `{ok:false}` si déjà répondu).
- `indiceRevele` démarre à 1 dès `demarrerManche()` (le 1er emoji est montré au départ).

- [ ] **Step A1 : Test — construction des manches plafonnée aux combos remplis**

```js
// serveur/__tests__/beboudle.test.js
const { Beboudle } = require('../beboudle');

const joueurs = [{ id: 'A', pseudo: 'Léa' }, { id: 'B', pseudo: 'Max' }];
const personnes = [
  { id: 'lucas-s', nom: 'Lucas S', combos: [['🏃','👟','😆','🍺'], ['🤫','🎯','🍺','🤏']] },
  { id: 'tutin', nom: 'Lucas Tutin', combos: [['🤓','🟢','⚽','⚪']] },
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
```

- [ ] **Step A2 : Run → échoue** (`cd serveur && npm test -- beboudle`) — Attendu : `Beboudle is not a constructor`.

- [ ] **Step A3 : Implémentation minimale** de `serveur/beboudle.js`

```js
// serveur/beboudle.js
// Logique pure du mini-jeu « Beboudle ». Aucun setTimeout (timers gérés par serveur.js).
const POINTS_PAR_INDICE = { 1: 500, 2: 300, 3: 150, 4: 50 };
const MALUS_FAUX = -100;

function melangeParDefaut(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Beboudle {
  constructor(joueurs, { personnes = [], manches = 10 } = {}, deps = {}) {
    this.joueurs = joueurs;
    this.personnes = personnes;
    this.melanger = deps.melanger || melangeParDefaut;
    this._scores = Object.fromEntries(joueurs.map((j) => [j.id, 0]));

    // Tous les couples (personne, combo rempli) → une manche chacun.
    const couples = [];
    for (const p of personnes) {
      for (const combo of (p.combos || [])) {
        if (Array.isArray(combo) && combo.length === 4) couples.push({ personneId: p.id, combo });
      }
    }
    this._manches = this.melanger(couples).slice(0, manches);
    this._total = this._manches.length;
    this._index = -1;       // index de la manche courante
    this._courante = null;  // { personneId, combo, choix, indice, reponses }
    this._finie = false;
  }

  _personne(id) { return this.personnes.find((p) => p.id === id) || { id, nom: '?' }; }

  demarrerManche() {
    this._index++;
    if (this._index >= this._total) { this._finie = true; return null; }
    const { personneId, combo } = this._manches[this._index];

    // 6 choix = bonne personne + 5 autres distinctes, mélangés.
    const autres = this.melanger(this.personnes.filter((p) => p.id !== personneId)).slice(0, 5);
    const choixPersonnes = this.melanger([this._personne(personneId), ...autres]);
    const choix = choixPersonnes.map((p) => ({ id: p.id, nom: p.nom }));

    this._courante = { personneId, combo, choix, indice: 1, reponses: {} };
    return { manche: this._index + 1, total: this._total, choix };
  }

  emoji(i) { return this._courante ? this._courante.combo[i] : null; }

  revelerProchain() {
    const c = this._courante;
    if (!c || c.indice >= 4) return null;
    c.indice++;
    return { indice: c.indice, emoji: c.combo[c.indice - 1] };
  }

  repondre(joueurId, personneId) {
    const c = this._courante;
    if (!c || c.reponses[joueurId] !== undefined) return { ok: false };
    c.reponses[joueurId] = personneId;
    const correct = personneId === c.personneId;
    const points = correct ? POINTS_PAR_INDICE[c.indice] : MALUS_FAUX;
    this._scores[joueurId] += points;
    return { ok: true, correct, points };
  }

  tousOntRepondu() {
    const c = this._courante;
    return !!c && this.joueurs.every((j) => c.reponses[j.id] !== undefined);
  }

  finirManche() {
    const c = this._courante;
    const p = this._personne(c.personneId);
    return {
      bonneReponse: { id: p.id, nom: p.nom, combo: c.combo },
      reponses: { ...c.reponses },
      scores: this.classement(),
    };
  }

  estFinie() { return this._finie; }

  classement() {
    return this.joueurs
      .map((j) => ({ id: j.id, pseudo: j.pseudo, points: this._scores[j.id] || 0 }))
      .sort((a, b) => b.points - a.points);
  }
}

module.exports = { Beboudle, POINTS_PAR_INDICE, MALUS_FAUX };
```

- [ ] **Step A4 : Run → passe.**

- [ ] **Step A5 : Tests — points selon l'indice, malus, réponse unique, 6 choix**

```js
test('points décroissants selon l’indice révélé', () => {
  const jeu = new Beboudle(joueurs, { personnes, manches: 10 }, sansMelange);
  jeu.demarrerManche();                       // indice 1 (la bonne = 1er couple)
  const bon = jeu._courante.personneId;
  expect(jeu.repondre('A', bon)).toEqual({ ok: true, correct: true, points: 500 });
  jeu.revelerProchain();                       // indice 2
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
```

- [ ] **Step A6 : Run → tout passe.**

- [ ] **Step A7 : Commit**

```bash
git add serveur/beboudle.js serveur/__tests__/beboudle.test.js
git commit -m "feat(beboudle): logique serveur pure + tests TDD"
```

---

## Phase B — Câblage serveur (`serveur/serveur.js`)

Reproduire le schéma de Turbo : un `slot` dans `parties[code]`, des timers gérés ici, des `diffuser(...)`. **Aucun test automatisé** (intégration WS) — vérification manuelle multi-onglets en Phase G.

**Files:** Modify `serveur/serveur.js`

- [ ] **Step B1 : importer la classe** en tête de fichier, près des autres :
```js
const { Beboudle } = require('./beboudle');
```

- [ ] **Step B2 : constantes de timing** (près du haut, après les `require`) :
```js
const BEBOUDLE_INTERVALLE = 15000; // ms entre chaque indice
const BEBOUDLE_GRACE = 15000;      // ms après le 4e indice avant clôture
const BEBOUDLE_PAUSE = 6000;       // ms d'écran scores entre manches
```

- [ ] **Step B3 : fonctions de déroulé** (à placer près de `demarrerCourse`/`finirCourse`) :
```js
// ── Déroulé Beboudle ────────────────────────────────────────────────────────
function demarrerMancheBeboudle(code) {
  const slot = parties[code];
  if (!slot || slot.idJeu !== 'beboudle') return;
  const m = slot.jeu.demarrerManche();
  if (!m) return finirBeboudle(code);

  diffuser(code, 'BEBOUDLE_MANCHE', { manche: m.manche, total: m.total, choix: m.choix });
  // Indice 1 tout de suite
  diffuser(code, 'REVELER_INDICE', { indice: 1, emoji: slot.jeu.emoji(0) });

  // Indices 2,3,4 toutes les 15 s, puis clôture.
  slot.timers = [];
  for (let k = 2; k <= 4; k++) {
    slot.timers.push(setTimeout(() => {
      const r = slot.jeu.revelerProchain();
      if (r) diffuser(code, 'REVELER_INDICE', r);
    }, BEBOUDLE_INTERVALLE * (k - 1)));
  }
  slot.timers.push(setTimeout(() => finirMancheBeboudle(code),
    BEBOUDLE_INTERVALLE * 3 + BEBOUDLE_GRACE));
}

function nettoyerTimersBeboudle(slot) {
  (slot.timers || []).forEach(clearTimeout);
  slot.timers = [];
}

function finirMancheBeboudle(code) {
  const slot = parties[code];
  if (!slot || slot.idJeu !== 'beboudle' || slot.mancheClose) return;
  slot.mancheClose = true;
  nettoyerTimersBeboudle(slot);
  const res = slot.jeu.finirManche();
  diffuser(code, 'BEBOUDLE_MANCHE_FINIE', res);
  setTimeout(() => {
    if (!parties[code]) return;
    slot.mancheClose = false;
    if (slot.jeu.estFinie()) finirBeboudle(code);
    else demarrerMancheBeboudle(code);
  }, BEBOUDLE_PAUSE);
}

function finirBeboudle(code) {
  const slot = parties[code];
  if (!slot) return;
  nettoyerTimersBeboudle(slot);
  diffuser(code, 'BEBOUDLE_FINIE', { classement: slot.jeu.classement() });
  delete parties[code];
}
```

- [ ] **Step B4 : brancher dans `CHOISIR_JEU`** — ajouter une branche `else if (msg.idJeu === 'beboudle')` AVANT la branche `turbo`/`else` :
```js
if (msg.idJeu === 'beboudle') {
  const personnes = msg.personnes || [];
  const jeu = new Beboudle(joueurs, { personnes, manches: msg.manches || 10 });
  parties[code] = { idJeu: 'beboudle', jeu, timers: [], mancheClose: false };
  diffuser(code, 'JEU_CHOISI', { idJeu: 'beboudle' });
  demarrerMancheBeboudle(code);
} else if (msg.idJeu === 'turbo') {
  // ... (inchangé)
```

- [ ] **Step B5 : handler `REPONDRE`** — ajouter après le bloc `TICKET_TERMINE` :
```js
else if (msg.type === 'REPONDRE') {
  const slot = parties[code];
  if (!slot || slot.idJeu !== 'beboudle') return; // garde-fou
  const r = slot.jeu.repondre(ws.idSocket, msg.personneId);
  if (!r.ok) return;
  diffuser(code, 'A_REPONDU', { pseudo: pseudoDe(code, ws.idSocket) });
  if (slot.jeu.tousOntRepondu()) finirMancheBeboudle(code);
}
```

- [ ] **Step B6 : nettoyage à la déconnexion** — dans `ws.on('close')`, le slot `beboudle` n'a pas de logique spéciale (la partie continue) ; s'assurer qu'aucun code n'assume `slot.partie`/`slot.jeu` sans vérifier `idJeu`. (Le code existant teste déjà `slot.idJeu === 'dessin'`.)

- [ ] **Step B7 : Run tests serveur** (`cd serveur && npm test`) — Attendu : toujours **vert** (on n'a pas cassé l'existant ; pas de nouveau test ici).

- [ ] **Step B8 : Commit**
```bash
git add serveur/serveur.js
git commit -m "feat(beboudle): cablage serveur (manches, indices, reponses)"
```

---

## Phase C — Données personnes côté app (TDD léger)

**Files:**
- Create: `src/donnees/personnes.js`, `src/donnees/__tests__/personnes.test.js`

- [ ] **Step C1 : Test — combos jouables + comptage**

```js
// src/donnees/__tests__/personnes.test.js
import { combosJouables, PERSONNES_DEFAUT } from '../personnes';

test('PERSONNES_DEFAUT contient Lucas S (3 combos) et Lucas Tutin (1)', () => {
  const ls = PERSONNES_DEFAUT.find((p) => p.nom === 'Lucas S');
  const lt = PERSONNES_DEFAUT.find((p) => p.nom === 'Lucas Tutin');
  expect(ls.combos).toHaveLength(3);
  expect(lt.combos).toHaveLength(1);
});

test('combosJouables ne compte que les combos de 4 emojis', () => {
  const data = [
    { id: 'x', nom: 'X', combos: [['a','b','c','d'], ['a','b']] },
    { id: 'y', nom: 'Y', combos: [] },
  ];
  expect(combosJouables(data)).toBe(1);
});
```

- [ ] **Step C2 : Run → échoue** (`npm test -- personnes`).

- [ ] **Step C3 : Implémentation** `src/donnees/personnes.js`

```js
// src/donnees/personnes.js
// Base de personnes du mini-jeu Beboudle, persistée en local sur l'hôte (AsyncStorage).
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLE = 'bebouparty.personnes';

// id stable + prénom + liste de combos (chaque combo = 4 emojis).
export const PERSONNES_DEFAUT = [
  { id: 'lucas-s', nom: 'Lucas S', combos: [
    ['🏃‍♂️', '👟', '😆', '🍺'],
    ['🤫', '🎯', '🍺', '🤏'],
    ['🙏', '👩', '🔞', '💘'],
  ] },
  { id: 'lucas-tutin', nom: 'Lucas Tutin', combos: [['🤓', '🟢', '⚽️', '⚪️']] },
  { id: 'alex', nom: 'Alex', combos: [] },
  { id: 'simon-c', nom: 'Simon C', combos: [] },
  { id: 'simon-kit', nom: 'Simon Kit', combos: [] },
  { id: 'simon-rousseau', nom: 'Simon Rousseau', combos: [] },
  { id: 'maxime', nom: 'Maxime', combos: [] },
  { id: 'wawan', nom: 'Wawan', combos: [] },
  { id: 'nathan', nom: 'Nathan', combos: [] },
  { id: 'charlelie', nom: 'Charlélie', combos: [] },
  { id: 'la-tang', nom: 'La Tang', combos: [] },
];

// Nombre de combos jouables (exactement 4 emojis) dans une base.
export function combosJouables(personnes) {
  return personnes.reduce(
    (n, p) => n + (p.combos || []).filter((c) => Array.isArray(c) && c.length === 4).length,
    0,
  );
}

// Charge la base depuis AsyncStorage ; seed avec la base par défaut si vide.
export async function chargerPersonnes() {
  try {
    const txt = await AsyncStorage.getItem(CLE);
    if (txt) return JSON.parse(txt);
  } catch (e) { /* ignore → seed */ }
  await sauverPersonnes(PERSONNES_DEFAUT);
  return PERSONNES_DEFAUT;
}

export async function sauverPersonnes(personnes) {
  try { await AsyncStorage.setItem(CLE, JSON.stringify(personnes)); } catch (e) {}
}

// Génère un id simple pour une nouvelle personne.
export function nouvelId(nom) {
  return (nom || 'p').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}
```

- [ ] **Step C4 : Run → passe.**

- [ ] **Step C5 : Commit**
```bash
git add src/donnees/personnes.js src/donnees/__tests__/personnes.test.js
git commit -m "feat(beboudle): base de personnes + persistance AsyncStorage"
```

---

## Phase D — Réseau app (`ClientReseau.js`)

**Files:** Modify `src/reseau/ClientReseau.js`

- [ ] **Step D1 : variables de replay anti-course** (près de `dernierCourseDemarre`) :
```js
let dernierBeboudleManche = null; // dernière BEBOUDLE_MANCHE reçue
let indicesBeboudle = [];         // indices révélés de la manche courante
```

- [ ] **Step D2 : mémoriser dans `emettre`** (ajouter aux conditions existantes) :
```js
if (evenement === 'beboudleManche') { dernierBeboudleManche = donnees; indicesBeboudle = []; }
if (evenement === 'revelerIndice') indicesBeboudle.push(donnees);
if (evenement === 'beboudleMancheFinie') indicesBeboudle = [];
if (evenement === 'beboudleFinie') { dernierBeboudleManche = null; indicesBeboudle = []; }
```

- [ ] **Step D3 : replay dans `sur`** (après les replays existants) :
```js
if (evenement === 'beboudleManche' && dernierBeboudleManche !== null) callback(dernierBeboudleManche);
if (evenement === 'revelerIndice') indicesBeboudle.forEach((d) => callback(d));
```

- [ ] **Step D4 : reset dans `connecter`** (avec les autres `dernier... = null`) :
```js
dernierBeboudleManche = null;
indicesBeboudle = [];
```

- [ ] **Step D5 : mapping des messages** dans `socket.onmessage` (après le bloc Turbo) :
```js
// Événements du mini-jeu « Beboudle »
case 'BEBOUDLE_MANCHE': emettre('beboudleManche', msg); break;
case 'REVELER_INDICE': emettre('revelerIndice', msg); break;
case 'A_REPONDU': emettre('aRepondu', msg); break;
case 'BEBOUDLE_MANCHE_FINIE': emettre('beboudleMancheFinie', msg); break;
case 'BEBOUDLE_FINIE': emettre('beboudleFinie', msg.classement); break;
```

- [ ] **Step D6 : fonctions sortantes** (près de `ticketTermine`).
  Le serveur lit `msg.reglages` pour le dessin et `msg.personnes`/`msg.manches` **au premier niveau** pour Beboudle. Donc **ne PAS toucher `choisirJeu`** (régression dessin sinon) ; ajouter deux fonctions dédiées :
```js
// Fonctions de jeu « Beboudle »
export function choisirBeboudle(personnes, manches = 10) {
  envoyer('CHOISIR_JEU', { idJeu: 'beboudle', personnes, manches });
}
export function repondre(personneId) { envoyer('REPONDRE', { personneId }); }
```

- [ ] **Step D7 : Run tests app** (`npm test`) — Attendu : vert (les tests `url`/`protocole` ne sont pas touchés).

- [ ] **Step D8 : Commit**
```bash
git add src/reseau/ClientReseau.js
git commit -m "feat(beboudle): evenements reseau + replay anti-course"
```

---

## Phase E — Sous-composants UI

Tous en `<Text>` natif pour les emojis. Couleurs depuis `src/theme/couleurs.js`, polices depuis `src/theme/styles.js`. Source visuelle = `mockups/beboudle.html`.

**Files (Create):** `src/composants/beboudle/CaseEmoji.js`, `BoutonPersonne.js`, `TimerIndice.js`, `ScoresManche.js`

- [ ] **Step E1 : `CaseEmoji.js`** — props `{ emoji, revele }`.
  - `revele=false` → fond glass sombre + bordure pointillée + « ? » qui pulse (`withRepeat` scale 1↔1.12).
  - `revele=true` → emoji affiché avec un **pop** au montage de la révélation (`withSequence` scale 0→1.3→1) + petit flash de bordure. Particules optionnelles (réutiliser l'idée `ConfettiBurst` de `src/composants/turbo/CaseGratter.js`, version légère).
  - Mémoïser pour ne pas rejouer le pop à chaque render.

- [ ] **Step E2 : `BoutonPersonne.js`** — props `{ nom, etat, gain, onPress, disabled }` avec `etat ∈ 'normal'|'choisi'|'bon'|'mauvais'`.
  - styles : normal = `rgba(123,47,190,.45)` ; choisi = dégradé violet vif + bordure blanche ; bon = vert + badge ✅ + `gain` (+points) flottant ; mauvais = rouge + badge ❌ + petit shake.
  - `Pressable`, `disabled` quand déjà répondu ou manche close.

- [ ] **Step E3 : `TimerIndice.js`** — props `{ duree, debut }` (ms). Barre qui se vide ; passe orange→rouge dans les 5 dernières s. S'inspirer de `src/composants/jeu/ChronoBar.js` (lire d'abord ce fichier pour réutiliser le même mécanisme d'animation).

- [ ] **Step E4 : `ScoresManche.js`** — props `{ visible, bonneReponse, scores, joueurs }`. Overlay plein écran semi-opaque : « La réponse était **{nom}** » + le combo (4 emojis) + mini-classement trié (pseudo + points, 1er en doré). Animation d'entrée (`FadeInDown`).

- [ ] **Step E5 : Commit**
```bash
git add src/composants/beboudle
git commit -m "feat(beboudle): sous-composants UI (case, bouton, timer, scores)"
```

---

## Phase F — Écran de jeu `EcranBeboudle.js`

**Files:** Create `src/ecrans/EcranBeboudle.js`. S'inspirer fortement de `EcranJeuDessin.js` (abonnements) et `EcranTurboJackpot.js` (overlays/flash).

État local : `manche`, `total`, `choix` ([{id,nom}]), `emojisReveles` (tableau de 4, `null` tant que caché), `maReponse` (personneId|null), `feedback` (toast), `finManche` (null|{bonneReponse,reponses,scores}).

- [ ] **Step F1 : abonnements** (montage unique, comme les autres écrans) :
```js
useEffect(() => {
  const offs = [];
  offs.push(Reseau.sur('listeJoueurs', setJoueurs));
  offs.push(Reseau.sur('beboudleManche', ({ manche, total, choix }) => {
    setManche(manche); setTotal(total); setChoix(choix);
    setEmojisReveles([null, null, null, null]);
    setMaReponse(null); setFinManche(null);
  }));
  offs.push(Reseau.sur('revelerIndice', ({ indice, emoji }) => {
    setEmojisReveles((prev) => { const c = [...prev]; c[indice - 1] = emoji; return c; });
    setDebutIndice(Date.now()); // relance la barre de timer
  }));
  offs.push(Reseau.sur('aRepondu', ({ pseudo }) => montrerToast(`${pseudo} a répondu !`)));
  offs.push(Reseau.sur('beboudleMancheFinie', (res) => setFinManche(res)));
  offs.push(Reseau.sur('beboudleFinie', (classement) => navigation.replace('Podium', { classement })));
  offs.push(Reseau.sur('deconnecte', () => navigation.replace('Accueil')));
  return () => offs.forEach((off) => off());
}, []);
```

- [ ] **Step F2 : répondre** — au tap d'un `BoutonPersonne` (si `maReponse === null` et pas de `finManche`) :
```js
function choisir(personneId) {
  if (maReponse !== null || finManche) return;
  setMaReponse(personneId);
  Reseau.repondre(personneId);
}
```

- [ ] **Step F3 : état des boutons** — pendant la manche : le bouton de `maReponse` = `'choisi'`, les autres `'normal'`. À la révélation (`finManche`) : bouton `bonneReponse.id` = `'bon'` ; si `maReponse` ≠ bonne → ce bouton = `'mauvais'`.

- [ ] **Step F4 : layout** (réf. mockup) : haut `MANCHE x/N` + score perso (depuis `finManche?.scores` ou cumul) ; 4 `CaseEmoji` ; `TimerIndice` ; toast feedback ; grille 2×3 de `BoutonPersonne` (`flex:0 0 auto`, centrée verticalement dans la zone basse via `margin:auto 0` comme dans le mockup validé) ; overlay `ScoresManche` quand `finManche`.

- [ ] **Step F5 : score perso affiché** — dériver de `finManche?.scores` (chercher `monId`) sinon 0. Optionnel : mémoriser un `monScore` mis à jour à chaque `beboudleMancheFinie`.

- [ ] **Step F6 : vérif bundle** — `npx expo export --platform android` ou recharge Metro ; aucun crash, l'écran s'affiche.

- [ ] **Step F7 : Commit**
```bash
git add src/ecrans/EcranBeboudle.js
git commit -m "feat(beboudle): ecran de jeu (cases, boutons, timer, scores)"
```

---

## Phase G — Intégration : carte, navigation, mode créateur, déploiement

**Files:** Modify `EcranSelectionJeu.js`, `Navigation.js`, `EcranAccueil.js` ; Create `EcranCreateur.js`.

- [ ] **Step G1 : carte Beboudle** dans `EcranSelectionJeu.js` — remplacer un `verrou` par :
```js
{ id: 'beboudle', nom: 'Beboudle', icone: '❓', couleur: COULEURS.rose, description: "T'as reconnu qui ?", verrouille: false },
```
…et réduire le `Array(6)` des verrous à `Array(5)`.

- [ ] **Step G2 : routage** — dans le `sur('jeuChoisi', ...)` :
```js
navigation.replace(idJeu === 'turbo' ? 'TurboJackpot' : idJeu === 'beboudle' ? 'Beboudle' : 'JeuDessin');
```
…et dans `choisir(jeu)` : pour `beboudle`, charger la base et lancer :
```js
if (jeu.id === 'beboudle') {
  const personnes = await chargerPersonnes();
  if (combosJouables(personnes) === 0) {
    Alert.alert('Beboudle', "Ajoute au moins un combo d'emojis dans le mode créateur (code 7285) avant de jouer.");
    return;
  }
  Reseau.choisirBeboudle(personnes, 10);
}
```
(importer `chargerPersonnes`, `combosJouables`, et rendre `choisir` async).

- [ ] **Step G3 : navigation** — `Navigation.js` : importer et déclarer `<Pile.Screen name="Beboudle" .../>` et `<Pile.Screen name="Createur" .../>`.

- [ ] **Step G4 : bouton créateur discret** sur `EcranAccueil.js` — petit bouton ✏️ en bas (faible opacité). Au tap : `Alert.prompt` (iOS) **ou** un mini-écran/modal de saisie code (Android n'a pas `Alert.prompt`). Implémentation portable : naviguer vers un petit modal de saisie, ou un `TextInput` masqué. Recommandé : modal local avec `TextInput` `keyboardType="number-pad"`, comparer à `'7285'` → `navigation.navigate('Createur')`.

- [ ] **Step G5 : `EcranCreateur.js`** — CRUD sur la base AsyncStorage :
  - Charger via `chargerPersonnes()` au montage.
  - Liste de cartes dépliables (une par personne) ; afficher chaque combo (4 emojis) avec boutons ✏️/🗑️ ; bouton « + combo ».
  - Édition combo : 4 `TextInput` (clavier emoji natif, `maxLength` court) + aperçu en direct + « Valider ».
  - « + Nouvelle personne » : `TextInput` prénom → `nouvelId(nom)`.
  - Chaque modification → `sauverPersonnes(nouvelleBase)` + maj state.
  - DA BebouParty (FondDegrade, CarteGlass, polices dorées).

- [ ] **Step G6 : tests complets** — `cd serveur && npm test` puis `npm test` racine. Attendu : **tout vert** (anciens + nouveaux).

- [ ] **Step G7 : déploiement serveur** — le serveur a changé (`serveur.js`, `beboudle.js`) → pousser et laisser Render redéployer (vérifier « Live »). L'app est rechargée via Metro.

- [ ] **Step G8 : test multi-onglets / multi-téléphones** — créer salle, lancer Beboudle, vérifier : révélation progressive synchronisée, toast « a répondu », barème de points, scores intermédiaires, podium final. Mode créateur : ajouter un combo à « Alex », rejouer, voir Alex tomber comme bonne réponse.

- [ ] **Step G9 : Commit final**
```bash
git add -A
git commit -m "feat(beboudle): integration (carte, navigation, mode createur) + deploiement"
```

---

## Notes d'équilibrage / pièges connus

- **Plafond de manches** : avec seulement 4 combos remplis au départ, une partie fait 4 manches (« MANCHE x/4 »), pas 10 — normal. Encourager l'ajout de combos via le créateur.
- **Race condition d'affichage** : `BEBOUDLE_MANCHE`/`REVELER_INDICE` peuvent arriver avant le montage de `EcranBeboudle` → géré par le **replay** (Phase D). Ne pas l'oublier, sinon la 1re manche s'affiche vide.
- **Android n'a pas `Alert.prompt`** → la porte du code `7285` doit utiliser un `TextInput` (modal/écran), pas `Alert.prompt`.
- **Distracteurs** : besoin d'au moins 6 personnes au total dans la base ; la base par défaut en compte 11 → OK.
- **Garde-fou serveur** : chaque handler vérifie `slot.idJeu === 'beboudle'` (comme dessin/turbo) pour ne pas mélanger les jeux.
