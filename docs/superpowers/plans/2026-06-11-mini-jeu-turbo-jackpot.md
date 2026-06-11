# Plan d'implémentation — Mini-jeu « Turbo Jackpot »

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le mini-jeu « Turbo Jackpot » : une course de karts synchronisée où l'on avance en grattant des tickets, avec serveur autoritaire pour les positions/effets/score et grattage local sur chaque téléphone.

**Architecture :** Nouveau moteur serveur de **logique pure** `serveur/turbo.js` (combos, effets, règles d'équilibre, fin de course — testé en TDD), branché dans `serveur/serveur.js` via un **registre multi-jeux** (`dessin` → `Partie`, `turbo` → `CourseTurbo`). Le grattage est 100% local (react-native-svg + PanResponder, seuil 70%) ; seul le ticket terminé `{symboles}` part au serveur, qui applique l'effet et diffuse l'état de course. Tout passe par `ClientReseau` (étendu). Réutilise le lobby, le podium et le thème.

**Tech Stack :** Node.js + `ws` (serveur), Jest (logique pure), React Native/Expo SDK 54, react-native-svg, PanResponder, react-native-reanimated.

**Notes pour l'exécutant :**
- Utilisateur débutant francophone → **code et commentaires en français**, noms en français.
- **Réutiliser** : `FondDegrade`, `CarteGlass`, `BoutonPrincipal`, `Mascotte`, `src/theme/*`, `ClientReseau`, `ChronoBar`, `EcranPodium`, le lobby/salle d'attente.
- **Référence visuelle validée** (à reproduire fidèlement) : `mockups/turbo-jackpot.html`.
- Fichiers serveur en **CommonJS**, app en **ESM**. Jest : `testEnvironment node`, `testMatch **/__tests__/**/*.test.js`. Test ciblé : `npm test -- <motcle>`. Le résumé Jest sort sur stderr (PowerShell l'enrobe d'un « NativeCommandError » → PAS une erreur si « Tests: X passed »).
- Branche git `main`, identité configurée. Commits fréquents. **Ne pas** pousser/déployer automatiquement (on testera d'abord ; push Render à la fin, étape dédiée).
- ⚠️ Bug connu déjà résolu sur ce projet : avec Reanimated installé, les callbacks de gesture-handler crashent → **on utilise PanResponder** pour tout ce qui est tactile (comme pour le Canvas de dessin).

---

## Conventions
- TDD pour toute la logique serveur (`turbo.js`).
- UI : créer le fichier → recharger dans Expo Go → vérifier → commit.
- Jamais de `WebSocket` direct dans un écran : tout via `ClientReseau`.

---

## Carte des fichiers

| Fichier | Responsabilité |
|---|---|
| `serveur/symbolesCombos.js` | Symboles, probas, détection de combo (pur, TDD) |
| `serveur/turbo.js` | Moteur de course : positions, effets, règles, fin, score (pur, TDD) |
| `serveur/serveur.js` | **Modifié** : registre multi-jeux + câblage turbo (timer, diffusion) |
| `src/reseau/ClientReseau.js` | **Modifié** : envoi `ticketTermine` + événements turbo |
| `src/donnees/symboles.js` | Symboles (emoji), probas, table combos d'AFFICHAGE (côté app) |
| `src/ecrans/EcranTurboJackpot.js` | Orchestrateur du jeu |
| `src/composants/turbo/Piste.js` | Lanes, karts, ligne d'arrivée, effets visuels |
| `src/composants/turbo/CaseGratter.js` | Une case grattable (svg + masque + % gratté) |
| `src/composants/turbo/TicketGratter.js` | Le ticket : 3 cases + enchaînement |
| `src/composants/turbo/BanniereCombo.js` | Bannière de résultat |
| `src/composants/turbo/FilDirect.js` | Le fil « EN DIRECT » (1 ligne) |
| `src/ecrans/EcranSelectionJeu.js` | **Modifié** : débloquer la carte Turbo Jackpot |
| `src/navigation/Navigation.js` | **Modifié** : écran `TurboJackpot` |

---

# PHASE A — Logique serveur (TDD)

### Task A1 : Symboles, probabilités et détection de combo

**Files :** Create `serveur/symbolesCombos.js`, Test `serveur/__tests__/symbolesCombos.test.js`.

- [ ] **Step 1 : Tests**
```js
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
```

- [ ] **Step 2 : Run** `npm test -- symbolesCombos` → FAIL.

- [ ] **Step 3 : Implémenter** `serveur/symbolesCombos.js`.
```js
// serveur/symbolesCombos.js
// Symboles, probabilités de tirage, et détection du combo à partir de 3 symboles.

const SYMBOLES = {
  fusee:    { emoji: '🚀', proba: 0.20 },
  etoile:   { emoji: '⭐', proba: 0.20 },
  bombe:    { emoji: '💣', proba: 0.18 },
  escargot: { emoji: '🐌', proba: 0.18 },
  bouclier: { emoji: '🛡️', proba: 0.12 },
  joker:    { emoji: '🃏', proba: 0.12 },
};

// Tire un symbole selon les probabilités. rng() ∈ [0,1) (injectable pour les tests).
function tirerSymbole(rng = Math.random) {
  const r = rng();
  let cumul = 0;
  for (const cle of Object.keys(SYMBOLES)) {
    cumul += SYMBOLES[cle].proba;
    if (r < cumul) return cle;
  }
  return 'joker'; // filet de sécurité
}

// Compte les occurrences de chaque symbole.
function compter(symboles) {
  const c = {};
  for (const s of symboles) c[s] = (c[s] || 0) + 1;
  return c;
}

// Détermine le combo. Renvoie { nom, effet } où effet décrit l'action (voir turbo.js).
// L'ordre des symboles n'a pas d'importance.
function detecterCombo(symboles) {
  const c = compter(symboles);
  const a = (s) => c[s] || 0;
  const triple = (s) => a(s) === 3;
  const paire = (s) => a(s) >= 2;
  const contient = (s) => a(s) >= 1;

  // --- TRÈS RARES d'abord ---
  if (a('fusee') === 1 && a('etoile') === 1 && a('joker') === 1) return combo('JACKPOT', { soi: +4, leader: -2 });
  if (paire('bombe') && contient('joker')) return combo('CHAOS TOTAL', { adversaires: -2 });
  if (triple('joker')) return combo('TRIPLE JOKER', { echangeLeader: true });

  // --- RARES (3 identiques + spéciaux) ---
  if (triple('fusee')) return combo('TURBO MAX', { soi: +3 });
  if (triple('bombe')) return combo('TRIPLE BOMBE', { adversaires: -1 });
  if (triple('escargot')) return combo('MALÉDICTION', { malediction: true });
  if (triple('bouclier')) return combo('BOUCLIER TOTAL', { bouclier: true });
  if (triple('etoile')) return combo('CONSTELLATION', { soi: +2, voleDevant: 1 });

  // --- FRÉQUENTS ---
  if (paire('fusee') && contient('etoile')) return combo('TURBO', { soi: +2 });
  if (paire('bombe')) return combo('PÉTARD', { devant: -1 });
  if (paire('escargot')) return combo('GADOUE', { soi: -1 });

  // --- TRÈS FRÉQUENTS ---
  if (paire('fusee')) return combo('BOOST', { soi: +1 });
  if (paire('etoile')) return combo('ÉCLAT', { soi: +1 });

  return combo('AUCUN', { soi: 0 });
}

function combo(nom, effet) { return { nom, effet }; }

module.exports = { SYMBOLES, tirerSymbole, detecterCombo, compter };
```

- [ ] **Step 4 : Run** `npm test -- symbolesCombos` → PASS.
- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat(turbo): symboles, probas et detection de combo (TDD)"`

---

### Task A2 : Moteur de course (positions, effets, règles, fin, score)

**Files :** Create `serveur/turbo.js`, Test `serveur/__tests__/turbo.test.js`.

> `CourseTurbo` est **pure** (pas de `setTimeout` ; le timer est géré par `serveur.js` qui passe `maintenantMs`). Elle applique les effets avec TOUTES les règles d'équilibre.

- [ ] **Step 1 : Tests** (couvrir : avancer, plafonds, recul max 3, min 0, devant/leader, bouclier, joker-leader→+2, malédiction 10 s non cumulable, fin par case 20, classement + points).
```js
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

test('le bouclier annule le prochain effet négatif', () => {
  const c = course();
  c.appliquerTicket('A', ['bouclier','bouclier','bouclier'], 0); // A bouclier
  c.appliquerTicket('B', ['fusee','fusee','fusee'], 0);          // B avance à 3
  c.appliquerTicket('B', ['bombe','bombe','fusee'], 0);          // B pète → devant = A ? non, A=0 ; cible "devant B" 
  // Pour tester le bouclier sur A, on vise A directement via TRIPLE BOMBE (tous adversaires -1)
  c.appliquerTicket('C', ['bombe','bombe','bombe'], 0);          // tous adversaires -1, A protégé
  expect(c.boucliers().A).toBe(false); // bouclier consommé
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
```

- [ ] **Step 2 : Run** `npm test -- turbo` → FAIL.

- [ ] **Step 3 : Implémenter** `serveur/turbo.js` (compléter jusqu'au vert). Squelette directeur :
```js
// serveur/turbo.js
const { detecterCombo } = require('./symbolesCombos');

const RECUL_MAX = 3;
const DUREE_MALEDICTION = 10000; // 10 s

class CourseTurbo {
  constructor(joueurs, { duree = 60, longueur = 20 } = {}) {
    this.joueurs = joueurs;
    this.duree = duree;          // secondes
    this.longueur = longueur;    // case d'arrivée
    this._pos = Object.fromEntries(joueurs.map(j => [j.id, 0]));
    this._bouclier = Object.fromEntries(joueurs.map(j => [j.id, false]));
    this._maledictionFin = Object.fromEntries(joueurs.map(j => [j.id, 0])); // timestamp de fin
    this._fini = false;
  }

  positions() { return { ...this._pos }; }
  boucliers() { return { ...this._bouclier }; }

  _leader() {
    return this.joueurs
      .map(j => j.id)
      .reduce((meilleur, id) => (this._pos[id] > this._pos[meilleur] ? id : meilleur));
  }
  // Joueur immédiatement DEVANT `id` (position juste supérieure). null si personne.
  _devant(id) {
    const moi = this._pos[id];
    let cible = null;
    for (const j of this.joueurs) {
      if (j.id === id) continue;
      if (this._pos[j.id] > moi && (cible === null || this._pos[j.id] < this._pos[cible])) cible = j.id;
    }
    return cible;
  }
  _avancer(id, n) { this._pos[id] = Math.min(this.longueur, this._pos[id] + n); }
  _reculer(id, n) {
    // Bouclier : annule le 1er effet négatif
    if (this._bouclier[id]) { this._bouclier[id] = false; return; }
    const recul = Math.min(RECUL_MAX, n);
    this._pos[id] = Math.max(0, this._pos[id] - recul);
  }
  _estMaudit(id, t) { return this._maledictionFin[id] > t; }

  // Applique un ticket terminé. Renvoie { combo, effets:[{joueurId,type}], feed:{message,ton} }.
  appliquerTicket(joueurId, symboles, t = Date.now()) {
    if (this._fini) return { combo: 'AUCUN', effets: [], feed: null };
    let { nom, effet } = detecterCombo(symboles);
    const effets = [];

    // Règle Joker-leader : tout combo "joker" (TRIPLE JOKER) devient +2 si on est leader
    if (nom === 'TRIPLE JOKER' && this._leader() === joueurId) {
      effet = { soi: +2 }; nom = 'JOKER (+2)';
    }

    // gain "soi" (réduit de 1 si maudit, jamais négatif via malédiction)
    if (typeof effet.soi === 'number') {
      let g = effet.soi;
      if (g > 0 && this._estMaudit(joueurId, t)) g = Math.max(0, g - 1);
      if (g >= 0) this._avancer(joueurId, g); else this._reculer(joueurId, -g);
      effets.push({ joueurId, type: g >= 0 ? 'boost' : 'recule' });
    }
    if (effet.devant === -1) { const d = this._devant(joueurId); if (d) { this._reculer(d, 1); effets.push({ joueurId: d, type: 'recule' }); } }
    if (typeof effet.adversaires === 'number') {
      for (const j of this.joueurs) if (j.id !== joueurId) { this._reculer(j.id, -effet.adversaires); effets.push({ joueurId: j.id, type: 'recule' }); }
    }
    if (effet.leader === -2) { const l = this._leader(); if (l !== joueurId) { this._reculer(l, 2); effets.push({ joueurId: l, type: 'recule' }); } }
    if (effet.voleDevant) { const d = this._devant(joueurId); if (d && this._pos[d] > 0) { this._pos[d] -= 1; this._avancer(joueurId, 1); effets.push({ joueurId: d, type: 'recule' }); } }
    if (effet.bouclier) { this._bouclier[joueurId] = true; effets.push({ joueurId, type: 'bouclier' }); }
    if (effet.malediction) { this._maledictionFin[joueurId] = t + DUREE_MALEDICTION; effets.push({ joueurId, type: 'ralenti' }); }
    if (effet.echangeLeader) { const l = this._leader(); if (l !== joueurId) { const tmp = this._pos[l]; this._pos[l] = this._pos[joueurId]; this._pos[joueurId] = tmp; effets.push({ joueurId, type: 'echange' }, { joueurId: l, type: 'echange' }); } }

    return { combo: nom, effets, feed: { message: this._messageFeed(joueurId, nom), ton: this._ton(nom) } };
  }

  _pseudo(id) { return (this.joueurs.find(j => j.id === id) || {}).pseudo || '?'; }
  _messageFeed(id, nom) { return `${this._pseudo(id)} → ${nom}`; }
  _ton(nom) {
    if (['GADOUE','MALÉDICTION'].includes(nom)) return 'bleu';
    if (['PÉTARD','TRIPLE BOMBE','CHAOS TOTAL'].includes(nom)) return 'rouge';
    if (['JACKPOT','TURBO MAX','TRIPLE JOKER','JOKER (+2)'].includes(nom)) return 'dore';
    return 'vert';
  }

  estFinie(t) {
    if (this._fini) return true;
    if (t >= this.duree * 1000) { this._fini = true; return true; }
    if (Object.values(this._pos).some(p => p >= this.longueur)) { this._fini = true; return true; }
    return false;
  }

  classement() {
    const tries = [...this.joueurs].sort((a, b) => this._pos[b.id] - this._pos[a.id]);
    const pts = [500, 300, 150];
    return tries.map((j, i) => ({ id: j.id, pseudo: j.pseudo, position: this._pos[j.id], points: pts[i] != null ? pts[i] : 50 }));
  }
}

module.exports = { CourseTurbo };
```
> **Important :** compléter/ajuster jusqu'à ce que TOUS les tests passent. Le test « bouclier » du plan peut être affiné — l'essentiel est : un bouclier actif annule le prochain `_reculer` et se consomme.

- [ ] **Step 4 : Run** `npm test -- turbo` → PASS.
- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat(turbo): moteur de course (effets, regles, fin, score) TDD"`

---

# PHASE B — Serveur multi-jeux + câblage Turbo

### Task B1 : Registre multi-jeux + messages Turbo

**Files :** Modify `serveur/serveur.js`.

> Aujourd'hui `CHOISIR_JEU` crée toujours une `Partie` (Dessine-moi). On généralise : selon `idJeu`, on instancie le bon moteur, et on route ses messages. La table `parties[code]` gagne un champ `idJeu`.

- [ ] **Step 1 :** Importer `const { CourseTurbo } = require('./turbo');`.
- [ ] **Step 2 :** Dans le handler `CHOISIR_JEU` : si `msg.idJeu === 'turbo'`, créer `parties[code] = { idJeu:'turbo', jeu: new CourseTurbo(gestion.listeJoueurs(code), { duree:60 }), debut: Date.now(), minuteur: null }`, diffuser `JEU_CHOISI { idJeu:'turbo' }`, puis `demarrerCourse(code)`. Sinon, garder le chemin « dessin » existant (renommer la création de Partie pour cohabiter ; `idJeu:'dessin'`).
- [ ] **Step 3 :** Nouveau handler message `TICKET_TERMINE { symboles }` : si la salle a une course turbo active, `const r = course.appliquerTicket(ws.idSocket, msg.symboles, Date.now())`, puis diffuser `ETAT_COURSE { positions: course.positions(), effets: r.effets }` et, si `r.feed`, `FEED r.feed`. Si `course.estFinie(maintenant)` → `finirCourse(code)`.
- [ ] **Step 4 :** Helpers :
```js
function demarrerCourse(code) {
  const slot = parties[code]; if (!slot) return;
  slot.debut = Date.now();
  const c = slot.jeu;
  diffuser(code, 'COURSE_DEMARRE', { duree: c.duree, positions: c.positions(), joueurs: gestion.listeJoueurs(code) });
  // Fin automatique au bout de la durée
  slot.minuteur = setTimeout(() => finirCourse(code), c.duree * 1000);
}
function finirCourse(code) {
  const slot = parties[code]; if (!slot) return;
  clearTimeout(slot.minuteur);
  diffuser(code, 'COURSE_FINIE', { classement: slot.jeu.classement() });
  delete parties[code];
}
```
- [ ] **Step 5 :** Vérifier que les messages de dessin ne s'appliquent qu'aux parties `idJeu==='dessin'` et `TICKET_TERMINE` qu'aux `idJeu==='turbo'` (garde-fous `if (slot.idJeu !== 'turbo') return;`).
- [ ] **Step 6 :** Smoke test serveur (démarrer en arrière-plan ~2 s, vérifier le log + page santé, arrêter). `npm test` → tout passe encore.
- [ ] **Step 7 : Commit** `git add -A && git commit -m "feat(turbo): serveur multi-jeux + cablage course"`

---

# PHASE C — Réseau app

### Task C1 : Étendre ClientReseau + routage de navigation

**Files :** Modify `src/reseau/ClientReseau.js`.

- [ ] **Step 1 :** Ajouter l'envoi : `export function ticketTermine(symboles) { envoyer('TICKET_TERMINE', { symboles }); }`.
- [ ] **Step 2 :** Dans `socket.onmessage`, ajouter :
```js
case 'COURSE_DEMARRE': emettre('courseDemarre', msg); break;
case 'ETAT_COURSE': emettre('etatCourse', msg); break;
case 'FEED': emettre('feed', msg); break;
case 'COURSE_FINIE': emettre('courseFinie', msg.classement); break;
```
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(turbo): ClientReseau etendu (course)"`

> Le routage de navigation selon `idJeu` se fait dans les écrans (Phase G) : l'événement `jeuChoisi` porte déjà `idJeu` ('dessin' ou 'turbo').

---

# PHASE D — Données app + déblocage de la carte

### Task D1 : Données symboles/combos (affichage) + carte de sélection

**Files :** Create `src/donnees/symboles.js`, Modify `src/ecrans/EcranSelectionJeu.js`.

- [ ] **Step 1 :** `src/donnees/symboles.js` : exporte `SYMBOLES` (clé→emoji), `tirerSymbole()` (mêmes probas que le serveur, pour le grattage local), et `decrireCombo(symboles)` qui renvoie `{ nom, description, ton, icone }` pour la bannière (table d'affichage alignée sur le serveur). Réutilise la logique de détection (recopier la même table — c'est de l'affichage ; le serveur reste l'autorité sur les positions).
- [ ] **Step 2 :** `EcranSelectionJeu.js` : transformer la 1ʳᵉ carte verrouillée en carte **active** « Turbo Jackpot » (icône 🏎️, couleur orange/jaune, description « Gratte et fonce ! »). Au tap → `navigation.navigate` ? Non : Turbo n'a pas de réglages → appeler directement `Reseau.choisirJeu('turbo')`. Garder « Devine le dessin » qui passe par `ReglagesPartie`. (Donc 2 cartes actives, chacune son flux.)
- [ ] **Step 3 :** Vérifier que l'abonnement `jeuChoisi` (chez les joueurs non-hôtes, dans `EcranAttenteJeu`) route vers le bon écran (voir Phase G).
- [ ] **Step 4 : Commit** `git add -A && git commit -m "feat(turbo): donnees symboles + carte debloquee"`

---

# PHASE E — Grattage

### Task E1 : CaseGratter (une case grattable)

**Files :** Create `src/composants/turbo/CaseGratter.js`.

> Technique : un `Svg` avec le **symbole dessous**, recouvert d'un `Rect` « argent » dont un **`<Mask>`** est creusé par les traits de grattage (PanResponder). On suit le **% gratté** via une grille (cellules touchées). À ≥ 70 %, on révèle (on cache l'argent) + callback `onRevele`.

- [ ] **Step 1 :** Implémenter (squelette directeur) :
```jsx
// src/composants/turbo/CaseGratter.js
import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
import Svg, { Defs, Mask, Rect, Path, Text as SvgText } from 'react-native-svg';

const N = 8; // grille NxN pour estimer le % gratté
export default function CaseGratter({ symboleEmoji, revele, onRevele }) {
  const [dim, setDim] = useState({ w: 1, h: 1 });
  const [chemin, setChemin] = useState('');     // trait de grattage (pour le masque)
  const [revLocal, setRevLocal] = useState(false);
  const cellules = useRef(new Set());
  const dimRef = useRef(dim); dimRef.current = dim;

  const marquer = (x, y) => {
    const { w, h } = dimRef.current;
    const cx = Math.floor((x / w) * N), cy = Math.floor((y / h) * N);
    cellules.current.add(cy * N + cx);
    if (cellules.current.size / (N * N) >= 0.7 && !revLocal) { setRevLocal(true); onRevele && onRevele(); }
  };

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !revele && !revLocal,
    onMoveShouldSetPanResponder: () => !revele && !revLocal,
    onPanResponderGrant: (e) => { const { locationX:x, locationY:y } = e.nativeEvent; setChemin(`M ${x} ${y}`); marquer(x, y); },
    onPanResponderMove: (e) => { const { locationX:x, locationY:y } = e.nativeEvent; setChemin((c) => `${c} L ${x} ${y}`); marquer(x, y); },
  }), [revele, revLocal]);

  const decouvert = revele || revLocal;
  return (
    <View style={styles.case} onLayout={(e)=>setDim({w:e.nativeEvent.layout.width,h:e.nativeEvent.layout.height})} {...pan.panHandlers}>
      <Svg width="100%" height="100%">
        {/* symbole dessous */}
        <SvgText x="50%" y="50%" fontSize={Math.min(dim.w,dim.h)*0.55} textAnchor="middle" alignmentBaseline="central">{symboleEmoji}</SvgText>
        {/* couche argent + masque creusé par le grattage */}
        {!decouvert && (
          <>
            <Defs>
              <Mask id="m">
                <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                <Path d={chemin} stroke="black" strokeWidth={dim.w*0.22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Mask>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="#cfcfd8" mask="url(#m)" />
          </>
        )}
      </Svg>
    </View>
  );
}
const styles = StyleSheet.create({ case: { flex:1, aspectRatio:0.74, borderRadius:16, overflow:'hidden', borderWidth:2, borderColor:'rgba(255,255,255,0.35)', backgroundColor:'#fff' } });
```
> Notes : l'id de `<Mask>` doit être **unique par case** (passer un `id` en prop, ex. `m-${index}`) pour éviter les collisions quand 3 cases coexistent. L'argent est ici un aplat ; on pourra l'embellir (reflet) ensuite. La révélation déclenche `onRevele` une seule fois.
- [ ] **Step 2 :** Vérifier sur téléphone : on gratte, l'argent s'efface, le symbole apparaît, et à ~70 % la case se révèle entièrement.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(turbo): case a gratter (masque + seuil 70%)"`

### Task E2 : TicketGratter (3 cases + enchaînement)

**Files :** Create `src/composants/turbo/TicketGratter.js`.

- [ ] **Step 1 :** Compose 3 `CaseGratter` (ids de masque uniques). Au montage, tire 3 symboles (`tirerSymbole` de `src/donnees/symboles`). Suit combien sont révélées ; quand **les 3** le sont → appelle `onTicketComplet(symboles)` (le parent enverra au réseau + affichera la bannière + enchaînera un nouveau ticket via un `key` qui change). Style ticket selon la maquette (titre doré, n°, texture, bordure dorée), labels sous chaque case.
- [ ] **Step 2 :** Vérifier l'enchaînement : 3 cases grattées → bannière → nouveau ticket auto.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(turbo): ticket (3 cases + enchainement auto)"`

---

# PHASE F — Piste, bannière, fil

### Task F1 : Piste (lanes, karts, ligne d'arrivée, effets)

**Files :** Create `src/composants/turbo/Piste.js`.

- [ ] **Step 1 :** Reproduire la zone haute de la maquette : fond foncé arrondi, ligne d'arrivée à damier à droite, une lane par joueur avec `Mascotte` (petite, `anime={false}`) + pseudo + kart (🏎️ retourné vers la droite). Props : `joueurs`, `positions` (id→0..20), `longueur` (20), `effets` (liste courte récente {joueurId,type}). Le kart se positionne en `%` = `position/longueur` ; animer le déplacement avec une transition Reanimated (`withTiming` sur translateX) à chaque changement. Déclencher les **animations d'effet** (boost doré, tremblement rouge, aura bouclier, teinte ralenti, tourbillon échange) selon le `type` reçu.
- [ ] **Step 2 :** Vérifier visuellement (peut être testé avec des positions factices).
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(turbo): piste + karts + effets"`

### Task F2 : BanniereCombo + FilDirect

**Files :** Create `src/composants/turbo/BanniereCombo.js`, `src/composants/turbo/FilDirect.js`.

- [ ] **Step 1 :** `BanniereCombo` : props `{ nom, description, ton, icone }` ; slide-up + couleur selon `ton` (vert/rouge/bleu/doré) ; visible ~1,5 s (le parent la masque). Style maquette (nom en grand espacé, description, icône).
- [ ] **Step 2 :** `FilDirect` : props `{ message, ton }` ; une ligne compacte avec point « live », couleur selon `ton`, petit fondu. Affiche le dernier événement reçu.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(turbo): banniere combo + fil en direct"`

---

# PHASE G — Orchestrateur + intégration

### Task G1 : EcranTurboJackpot

**Files :** Create `src/ecrans/EcranTurboJackpot.js`, Modify `src/navigation/Navigation.js`.

> Orchestrateur : s'abonne aux événements course, tient l'état (positions, joueurs, effets récents, dernier feed, chrono), compose `ChronoBar` + `Piste` (haut) + `TicketGratter` + `FilDirect` + `BanniereCombo` (bas). À `courseFinie` → `navigation.replace('Podium', { classement })`.

- [ ] **Step 1 :** Abonnements :
```jsx
useEffect(() => {
  const offs = [];
  offs.push(Reseau.sur('courseDemarre', ({ duree, positions, joueurs }) => { setJoueurs(joueurs); setPositions(positions); setDebut(Date.now()); setDuree(duree); }));
  offs.push(Reseau.sur('etatCourse', ({ positions, effets }) => { setPositions(positions); setEffets(effets); }));
  offs.push(Reseau.sur('feed', (f) => setFeed(f)));
  offs.push(Reseau.sur('courseFinie', (classement) => navigation.replace('Podium', { classement })));
  offs.push(Reseau.sur('deconnecte', () => navigation.replace('Accueil')));
  return () => offs.forEach((o) => o());
}, []);
```
- [ ] **Step 2 :** `TicketGratter` `onTicketComplet={(symboles) => { Reseau.ticketTermine(symboles); setBanniere(decrireCombo(symboles)); setTimeout(()=>setBanniere(null), 1500); }}`. (La bannière s'affiche localement à partir de la table d'affichage ; le serveur reste l'autorité des positions.)
- [ ] **Step 3 :** Déclarer `TurboJackpot` dans `Navigation.js`.
- [ ] **Step 4 : Commit** `git add -A && git commit -m "feat(turbo): ecran orchestrateur + navigation"`

### Task G2 : Routage de navigation selon le jeu

**Files :** Modify `src/ecrans/EcranAttenteJeu.js`, `src/ecrans/EcranSelectionJeu.js`, `src/ecrans/ReglagesPartie.js`.

- [ ] **Step 1 :** Partout où l'on navigue sur `jeuChoisi`/lancement : router vers `JeuDessin` si `idJeu==='dessin'`, vers `TurboJackpot` si `idJeu==='turbo'`. (`EcranAttenteJeu` reçoit `jeuChoisi (idJeu)` → `navigation.replace(idJeu==='turbo'?'TurboJackpot':'JeuDessin')`.) L'hôte : `EcranSelectionJeu` route déjà selon la carte cliquée.
- [ ] **Step 2 :** Vérifier que les joueurs non-hôtes arrivent sur le bon écran pour chaque jeu.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(turbo): routage navigation multi-jeux"`

---

# PHASE H — Intégration & déploiement

### Task H1 : Vérification complète

- [ ] **Step 1 :** `npm test` → tous les tests (base + dessin + turbo) au vert.
- [ ] **Step 2 :** Bundler : `npx expo export --platform android --output-dir _t` → 0 erreur ; supprimer `_t`.
- [ ] **Step 3 :** Test manuel (1 téléphone solo + idéalement 2) : sélectionner Turbo → course → gratter → effets synchronisés → fin (timer/case 20) → podium + points.
- [ ] **Step 4 :** Déploiement : `git push origin main` (Render redéploie le serveur).
- [ ] **Step 5 :** Cocher les critères de réussite de la spec (§14).

---

## Critères de réussite (spec §14)
1. L'hôte lance Turbo → tous sur l'écran de course.
2. Gratter un ticket → combo → effet **synchronisé** (positions identiques partout).
3. Effets visuels + fil en direct s'affichent.
4. Fin (timer / case 20) → podium + points.
5. Règles d'équilibre respectées (tests).
6. Réseau centralisé dans `ClientReseau` ; serveur multi-jeux propre.
