# Plan d'implémentation — Mini-jeu « Devine le dessin »

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le gameplay skribbl temps réel à BebouParty : un joueur dessine un mot en direct, les autres devinent dans un chat, score et podium — le tout piloté par le serveur autoritaire déjà déployé.

**Architecture :** Le serveur (`ws`, sur Render) devient autoritaire pour le jeu via un module de **logique pure** `serveur/partie.js` (machine à états, testé en TDD), câblé dans `serveur/serveur.js`. Les téléphones affichent et envoient des actions ; toute la communication passe par le module découplé `src/reseau/ClientReseau.js` (étendu). Le dessin est synchronisé par un **flux de points normalisés (0–1)** throttlé, relayé à la salle.

**Tech Stack :** Node.js + `ws` (serveur), React Native/Expo SDK 54, react-native-svg (canvas), react-native-gesture-handler (capture tactile), react-native-reanimated, Jest (logique pure).

**Notes pour l'exécutant :**
- Utilisateur débutant, francophone → **code et commentaires en français**, noms en français.
- **Réutiliser** l'existant : `FondDegrade`, `CarteGlass`, `BoutonPrincipal`, `Mascotte`, `src/theme/*`, `ClientReseau`, contexte joueur.
- **Référence visuelle validée** pour la mise en page du jeu : `.superpowers/brainstorm/759-1780851253/jeu-layout-v3.html` (canvas en grand, outils en bas, panneaux encadrés, chat encadré).
- Jest est configuré (`testEnvironment: node`, `testMatch: **/__tests__/**/*.test.js`). Les fichiers serveur sont en **CommonJS** (`require`/`module.exports`), l'app en **ESM** (`import`).
- **Déviation assumée vs spec §9 :** la normalisation des réponses est **uniquement côté serveur** (`serveur/normaliser.js`) car c'est le serveur qui valide. Pas de `src/jeu/normaliser.js` côté app (l'app envoie le texte brut).
- Branche git : `main` (le projet est déjà sur GitHub + déployé Render). Faire des commits fréquents. **Ne pas** pousser/déployer automatiquement : on testera d'abord, le déploiement Render se fera quand on poussera explicitement.

---

## Conventions
- TDD pour toute la logique serveur : test rouge → code minimal → vert → commit.
- UI : créer le fichier → recharger dans Expo Go → vérifier → commit.
- Jamais de `WebSocket` direct dans un écran : tout via `ClientReseau`.
- Coordonnées de dessin **normalisées 0–1** (indépendantes de la taille d'écran).

---

## Carte des fichiers

| Fichier | Responsabilité |
|---|---|
| `serveur/normaliser.js` | Normalisation d'une réponse + détection « tout proche » (pur, TDD) |
| `serveur/mots.js` | Liste de mots FR + tirage de 3 mots distincts (pur, TDD) |
| `serveur/partie.js` | Machine à états d'une partie : tours, mot, score, fin (pur, TDD) |
| `serveur/serveur.js` | **Étendu** : câble `partie.js`, relaie le dessin, gère le chrono |
| `src/reseau/ClientReseau.js` | **Étendu** : envois + événements du jeu |
| `src/ecrans/ReglagesPartie.js` | Écran hôte : manches + temps |
| `src/ecrans/EcranJeuDessin.js` | **Remplace le placeholder** : orchestre rôles + sur-écrans |
| `src/ecrans/EcranPodium.js` | Classement final |
| `src/composants/jeu/Canvas.js` | Dessin (capture + rendu des traits) |
| `src/composants/jeu/BarreOutils.js` | Palette, tailles, gomme, fond, annuler, effacer |
| `src/composants/jeu/ChatDevinettes.js` | Messages + saisie |
| `src/composants/jeu/TableauScores.js` | Bande joueurs + scores + état |
| `src/composants/jeu/ChronoBar.js` | Barre + compte à rebours local |
| `src/composants/jeu/ChoixMot.js` | Sur-écran : choisir 1 des 3 mots |
| `src/composants/jeu/RevelationTour.js` | Sur-écran fin de tour |
| `src/donnees/motsAffichage.js` | (option) helper d'affichage des tirets côté app |

---

# PHASE A — Logique serveur (TDD)

### Task A1 : Normalisation des réponses

**Files :** Create `serveur/normaliser.js`, Test `serveur/__tests__/normaliser.test.js`.

- [ ] **Step 1 : Tests**
```js
// serveur/__tests__/normaliser.test.js
const { normaliser, estProche } = require('../normaliser');

test('normaliser enlève accents, casse et espaces superflus', () => {
  expect(normaliser('  Éléphant ')).toBe('elephant');
  expect(normaliser('CRÊPE')).toBe('crepe');
  expect(normaliser('un  chat')).toBe('un chat');
});

test('estProche : vrai si une seule lettre diffère', () => {
  expect(estProche('maison', 'maisom')).toBe(true);   // substitution
  expect(estProche('chat', 'chats')).toBe(true);       // ajout
  expect(estProche('chien', 'chein')).toBe(true);      // inversion proche (distance 2 → à vérifier)
  expect(estProche('maison', 'voiture')).toBe(false);
  expect(estProche('maison', 'maison')).toBe(false);   // identique n'est pas "proche"
});
```
> Note : si le cas « chein » (distance 2) échoue, ajuster le test — la règle retenue est **distance de Levenshtein === 1**. Garder la règle simple et documentée.

- [ ] **Step 2 : Run** `npm test -- normaliser` → FAIL.
- [ ] **Step 3 : Implémenter**
```js
// serveur/normaliser.js
// Normalise une réponse pour la comparaison (minuscule, sans accents, espaces réduits).
function normaliser(texte) {
  return (texte || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève les accents
    .replace(/\s+/g, ' ')
    .trim();
}

// Distance de Levenshtein entre deux chaînes.
function distance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[m][n];
}

// "Tout proche" = exactement 1 caractère de différence (après normalisation).
function estProche(reponse, mot) {
  return distance(normaliser(reponse), normaliser(mot)) === 1;
}

module.exports = { normaliser, estProche, distance };
```
- [ ] **Step 4 : Run** `npm test -- normaliser` → PASS (ajuster le test « chein » si besoin).
- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat(jeu): normalisation des reponses (TDD)"`

---

### Task A2 : Liste de mots et tirage

**Files :** Create `serveur/mots.js`, Test `serveur/__tests__/mots.test.js`.

- [ ] **Step 1 : Tests**
```js
// serveur/__tests__/mots.test.js
const { MOTS, tirerTrois } = require('../mots');

test('la liste contient au moins 100 mots', () => {
  expect(MOTS.length).toBeGreaterThanOrEqual(100);
});

test('tirerTrois renvoie 3 mots distincts de la liste', () => {
  const t = tirerTrois();
  expect(t).toHaveLength(3);
  expect(new Set(t).size).toBe(3);
  t.forEach((m) => expect(MOTS).toContain(m));
});

test('tirerTrois évite les mots déjà utilisés si possible', () => {
  const exclus = new Set(MOTS.slice(0, MOTS.length - 3));
  const t = tirerTrois(exclus);
  t.forEach((m) => expect(exclus.has(m)).toBe(false));
});
```
- [ ] **Step 2 : Run** `npm test -- mots` → FAIL.
- [ ] **Step 3 : Implémenter** `serveur/mots.js` : un tableau d'au moins **150 mots français simples** (objets, animaux, nourriture, actions, lieux — adaptés au dessin) + :
```js
// serveur/mots.js
const MOTS = [
  'maison', 'chat', 'chien', 'soleil', 'voiture', 'arbre', 'fleur', 'poisson',
  'pizza', 'fusee', 'robot', 'banane', 'guitare', 'montagne', 'parapluie',
  'ordinateur', 'telephone', 'ballon', 'fantome', 'dinosaure', 'licorne',
  /* … compléter jusqu'à ≥150 mots faciles à dessiner, sans accents si possible … */
];

// Tire 3 mots distincts, en évitant ceux de `exclus` (un Set) si possible.
function tirerTrois(exclus = new Set()) {
  let dispo = MOTS.filter((m) => !exclus.has(m));
  if (dispo.length < 3) dispo = [...MOTS]; // sécurité si presque tout est exclu
  const choix = [];
  const copie = [...dispo];
  while (choix.length < 3 && copie.length) {
    const i = Math.floor(Math.random() * copie.length);
    choix.push(copie.splice(i, 1)[0]);
  }
  return choix;
}

module.exports = { MOTS, tirerTrois };
```
- [ ] **Step 4 : Run** `npm test -- mots` → PASS.
- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat(jeu): liste de mots FR + tirage (TDD)"`

---

### Task A3 : Machine à états de la partie

**Files :** Create `serveur/partie.js`, Test `serveur/__tests__/partie.test.js`.

> `Partie` est **pure et déterministe pour tout sauf le tirage des mots** (injecté pour les tests). Pas de `setTimeout` ici : le chrono est géré par `serveur.js`. La partie expose des méthodes appelées par le serveur et renvoie des objets décrivant « ce qui doit être diffusé ».

- [ ] **Step 1 : Tests** (couvrir : ordre des tours, choix du mot, deviner exact/proche/faux, score décroissant, dessinateur ne devine pas, fin de tour quand tous ont trouvé, passage de manche, fin de partie + classement, départ du dessinateur).
```js
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
```
- [ ] **Step 2 : Run** `npm test -- partie` → FAIL.
- [ ] **Step 3 : Implémenter** `serveur/partie.js`. Squelette directeur (compléter pour faire passer TOUS les tests) :
```js
// serveur/partie.js
const { normaliser, estProche } = require('./normaliser');
const motsParDefaut = require('./mots');

class Partie {
  // joueurs: [{id, pseudo, mascotte?}], reglages: {manches, duree}
  // deps: { tirerTrois } injectable pour les tests
  constructor(joueurs, reglages, deps = {}) {
    this.joueurs = joueurs;
    this.reglages = reglages;
    this.tirerTrois = deps.tirerTrois || motsParDefaut.tirerTrois;
    this.ordre = joueurs.map((j) => j.id);
    this.indexDessinateur = -1;
    this.manche = 1;
    this._scores = Object.fromEntries(this.ordre.map((id) => [id, 0]));
    this.motsUtilises = new Set();
    this.finie = false;
    this._resetTour();
  }

  _resetTour() {
    this.dessinateurId = null;
    this.mot = null;
    this.aTrouve = new Set();    // ids des devineurs ayant trouvé
    this.tourActif = false;
  }

  demarrerTour() {
    this.indexDessinateur++;
    if (this.indexDessinateur >= this.ordre.length) { // fin de manche
      this.indexDessinateur = 0;
      this.manche++;
    }
    if (this.manche > this.reglages.manches) { this.finie = true; return null; }
    this._resetTour();
    this.dessinateurId = this.ordre[this.indexDessinateur];
    this.motsProposes = this.tirerTrois(this.motsUtilises);
    return { dessinateurId: this.dessinateurId, mots: this.motsProposes };
  }

  choisirMot(mot) {
    this.mot = mot;
    this.motsUtilises.add(mot);
    this.tourActif = true;
    return { nbLettres: mot.length, duree: this.reglages.duree };
  }

  // tempsRestant en secondes (fourni par le serveur)
  deviner(joueurId, texte, tempsRestant) {
    if (!this.tourActif) return { resultat: 'inactif' };
    if (joueurId === this.dessinateurId) return { resultat: 'interdit' };
    if (this.aTrouve.has(joueurId)) return { resultat: 'deja' };
    if (normaliser(texte) === normaliser(this.mot)) {
      const points = this._pointsDevineur(tempsRestant);
      this._scores[joueurId] += points;
      this._scores[this.dessinateurId] += this._pointsDessinateur();
      this.aTrouve.add(joueurId);
      return { resultat: 'exact', points };
    }
    if (estProche(texte, this.mot)) return { resultat: 'proche' };
    return { resultat: 'faux' };
  }

  _pointsDevineur(tempsRestant) {
    const ratio = Math.max(0, tempsRestant) / this.reglages.duree;
    return 50 + Math.round(ratio * 100); // 50 à 150
  }
  _pointsDessinateur() { return 25; } // par devineur correct

  tousOntTrouve() {
    const nbDevineurs = this.ordre.length - 1;
    return this.aTrouve.size >= nbDevineurs;
  }

  joueurParti(joueurId) {
    // retire des scores futurs ? On garde simple : si c'est le dessinateur, le tour se termine.
    if (joueurId === this.dessinateurId && this.tourActif) {
      this.tourActif = false;
      return { tourTermine: true, mot: this.mot };
    }
    this.aTrouve.delete(joueurId);
    return { tourTermine: false };
  }

  finTour() {
    this.tourActif = false;
    return { mot: this.mot, scores: this.scores() };
  }

  estFinie() { return this.finie; }
  scores() { return { ...this._scores }; }
  classement() {
    return this.joueurs
      .map((j) => ({ id: j.id, pseudo: j.pseudo, points: this._scores[j.id] || 0 }))
      .sort((a, b) => b.points - a.points);
  }
}

module.exports = { Partie };
```
- [ ] **Step 4 : Run** `npm test -- partie` → PASS (compléter le code jusqu'au vert).
- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat(jeu): machine a etats de la partie (TDD)"`

---

# PHASE B — Câblage du serveur

### Task B1 : Brancher la partie + relais du dessin + chrono

**Files :** Modify `serveur/serveur.js`.

> On garde la gestion des salles existante. On ajoute un état `partie` par salle, on traite les nouveaux messages, on relaie le dessin (uniquement du dessinateur), et on gère le chrono avec `setTimeout`.

- [ ] **Step 1 :** Ajouter en haut : `const { Partie } = require('./partie');` et une table `const parties = {}; // code -> { partie, minuteur }`.

- [ ] **Step 2 :** Étendre le `switch`/`if` des messages :
  - `CHOISIR_JEU { idJeu, reglages }` (hôte) : créer `new Partie(gestion.listeJoueurs(code), reglages)`, stocker dans `parties[code]`, diffuser `JEU_CHOISI {idJeu}` (les apps naviguent vers le jeu), puis appeler `demarrerTourEtAnnoncer(code)`.
  - `CHOISIR_MOT { mot }` (dessinateur courant) : `partie.choisirMot(mot)`, diffuser `TOUR_DEMARRE { dessinateurId, nbLettres, duree }`, démarrer le chrono (`setTimeout(duree*1000)` → `finirTour(code)`).
  - Messages de dessin (`TRAIT_DEBUT/TRAIT_POINTS/TRAIT_FIN/ANNULER/EFFACER_TOUT/FOND`) : **vérifier que `ws.idSocket === partie.dessinateurId`**, puis **relayer tel quel** à toute la salle (sauf l'émetteur).
  - `DEVINER { texte }` : `const r = partie.deviner(ws.idSocket, texte, tempsRestant(code));`
    - `exact` → diffuser `A_TROUVE { joueurId, pseudo }` + `SCORES { joueurs }` ; si `partie.tousOntTrouve()` → `finirTour(code)`.
    - `proche` → envoyer `PRESQUE { pseudo }` **à l'auteur uniquement** (défaut spec).
    - `faux` → diffuser `MESSAGE_CHAT { pseudo, texte }`.

- [ ] **Step 3 :** Fonctions utilitaires dans `serveur.js` :
```js
function demarrerTourEtAnnoncer(code) {
  const p = parties[code].partie;
  const tour = p.demarrerTour();
  if (!tour) { return finirPartie(code); }       // plus de manche → podium
  // envoyer les 3 mots AU dessinateur uniquement
  envoyerA(tour.dessinateurId, 'CHOIX_MOTS', { mots: tour.mots });
  // prévenir tout le monde qui va dessiner (sans le mot)
  diffuser(code, 'PREPARATION', { dessinateurId: tour.dessinateurId });
}

function finirTour(code) {
  const slot = parties[code]; if (!slot) return;
  clearTimeout(slot.minuteur);
  const { mot, scores } = slot.partie.finTour();
  diffuser(code, 'TOUR_FINI', { mot, scores });
  // petite pause de révélation puis tour suivant
  slot.minuteur = setTimeout(() => demarrerTourEtAnnoncer(code), 5000);
}

function finirPartie(code) {
  const slot = parties[code]; if (!slot) return;
  diffuser(code, 'PARTIE_FINIE', { classement: slot.partie.classement() });
  delete parties[code];
}
```
> `envoyerA(idSocket, ...)` = retrouver le `ws` dont `ws.idSocket === idSocket` parmi `wss.clients` et lui envoyer. `tempsRestant(code)` = calculé depuis l'instant de `TOUR_DEMARRE` mémorisé (`slot.debut`) : `Math.max(0, duree - (Date.now()-slot.debut)/1000)`.

- [ ] **Step 4 :** Gérer la **déconnexion** (`ws.on('close')`) : si une partie existe pour `ws.codeSalle`, appeler `partie.joueurParti(ws.idSocket)` ; si `tourTermine`, `finirTour(code)`.

- [ ] **Step 5 :** Vérifier le serveur en local (smoke test) : démarrer, vérifier la page santé, arrêter (voir motif PowerShell des phases précédentes). Pas de test unitaire ici (la logique est déjà testée dans `partie.js`).

- [ ] **Step 6 : Commit** `git add -A && git commit -m "feat(jeu): cablage serveur (partie, relais dessin, chrono)"`

---

# PHASE C — Réseau côté app

### Task C1 : Étendre ClientReseau

**Files :** Modify `src/reseau/ClientReseau.js`.

- [ ] **Step 1 :** Ajouter les fonctions d'envoi (réutilisent le `envoyer(type, donnees)` privé existant) :
```js
export function choisirJeu(idJeu, reglages) { envoyer('CHOISIR_JEU', { idJeu, reglages }); }
export function choisirMot(mot) { envoyer('CHOISIR_MOT', { mot }); }
export function traitDebut(t) { envoyer('TRAIT_DEBUT', t); }   // {id, couleur, taille}
export function traitPoints(id, points) { envoyer('TRAIT_POINTS', { id, points }); }
export function traitFin(id) { envoyer('TRAIT_FIN', { id }); }
export function annulerTrait() { envoyer('ANNULER'); }
export function effacerTout() { envoyer('EFFACER_TOUT'); }
export function changerFond(couleur) { envoyer('FOND', { couleur }); }
export function deviner(texte) { envoyer('DEVINER', { texte }); }
```
> ⚠️ `choisirJeu` existe déjà (sans `reglages`) : le **remplacer** par cette version. Adapter l'appelant (voir Task D2).

- [ ] **Step 2 :** Dans `socket.onmessage`, ajouter les nouveaux types → événements clairs :
```js
case 'CHOIX_MOTS': emettre('choixMots', msg.mots); break;
case 'PREPARATION': emettre('preparation', msg); break;
case 'TOUR_DEMARRE': emettre('tourDemarre', msg); break;
case 'TRAIT_DEBUT': emettre('traitDebut', msg); break;
case 'TRAIT_POINTS': emettre('traitPoints', msg); break;
case 'TRAIT_FIN': emettre('traitFin', msg); break;
case 'ANNULER': emettre('annuler'); break;
case 'EFFACER_TOUT': emettre('effacerTout'); break;
case 'FOND': emettre('fond', msg.couleur); break;
case 'A_TROUVE': emettre('aTrouve', msg); break;
case 'PRESQUE': emettre('presque', msg); break;
case 'MESSAGE_CHAT': emettre('messageChat', msg); break;
case 'SCORES': emettre('scores', msg.scores); break;
case 'TOUR_FINI': emettre('tourFini', msg); break;
case 'PARTIE_FINIE': emettre('partieFinie', msg.classement); break;
```
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(jeu): ClientReseau etendu pour le jeu"`

---

# PHASE D — Réglages hôte & lancement

### Task D1 : Écran ReglagesPartie

**Files :** Create `src/ecrans/ReglagesPartie.js`, Modify `src/navigation/Navigation.js`.

- [ ] **Step 1 :** Créer l'écran (réutiliser `FondDegrade`, `CarteGlass`, `BoutonPrincipal`). Deux groupes de boutons-choix : **Manches** (1/2/3, défaut 2) et **Temps** (60/80/100 s, défaut 80). Bouton « Lancer la partie » → `navigation.replace('JeuDessin', { reglages, estDessinateurInitial: ... })` n'est PAS nécessaire : on envoie au serveur et on laisse les événements piloter. Concrètement : `Reseau.choisirJeu('dessin', { manches, duree })` ; la navigation vers `JeuDessin` se fait à réception de `jeuChoisi` (déjà géré dans `EcranSelectionJeu`). Donc ici, on **envoie et on revient**, ou on route directement. Choix simple : depuis cet écran, appeler `Reseau.choisirJeu('dessin', reglages)` puis `navigation.replace('JeuDessin')`.
- [ ] **Step 2 :** Déclarer l'écran `ReglagesPartie` dans `Navigation.js`.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(jeu): ecran reglages de partie (hote)"`

### Task D2 : Router la sélection du jeu vers les réglages

**Files :** Modify `src/ecrans/EcranSelectionJeu.js`.

- [ ] **Step 1 :** Au tap sur la carte active « Devine le dessin », **au lieu** d'appeler `choisirJeu` directement, faire `navigation.navigate('ReglagesPartie')`. Conserver l'abonnement à `jeuChoisi` (pour que les **joueurs** non-hôtes soient redirigés vers `JeuDessin` quand l'hôte lance).
- [ ] **Step 2 :** Vérifier que les joueurs reçoivent `jeuChoisi` → `navigation.replace('JeuDessin')`.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(jeu): selection jeu -> reglages hote"`

---

# PHASE E — Canvas et outils

### Task E1 : Composant Canvas (le cœur du dessin)

**Files :** Create `src/composants/jeu/Canvas.js`.

> Capture tactile (dessinateur) → points **normalisés 0–1** → throttle ~50 ms → callbacks `onTraitDebut/onTraitPoints/onTraitFin`. Rendu : liste de traits (props `traits`) en `Path` svg + fond. Le même composant sert au dessinateur (interactif) et aux devineurs (lecture seule via `interactif={false}`).

- [ ] **Step 1 :** Implémenter :
```jsx
// src/composants/jeu/Canvas.js
import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// traits: [{ id, couleur, taille, points:[[x,y]...] }] en coords normalisées 0-1
// fond: couleur de fond. interactif: si true, on capture le dessin.
export default function Canvas({ traits, fond = '#ffffff', interactif, couleur, taille, onTraitDebut, onTraitPoints, onTraitFin }) {
  const [taille_, setTaille] = useState({ w: 1, h: 1 });
  const traitEnCours = useRef(null);
  const buffer = useRef([]);
  const dernierEnvoi = useRef(0);

  const versNorm = (x, y) => [Math.min(1, Math.max(0, x / taille_.w)), Math.min(1, Math.max(0, y / taille_.h))];

  const pan = Gesture.Pan()
    .enabled(!!interactif)
    .onBegin((e) => {
      const id = String(Date.now());
      traitEnCours.current = id;
      buffer.current = [versNorm(e.x, e.y)];
      onTraitDebut && onTraitDebut({ id, couleur, taille });
      onTraitPoints && onTraitPoints(id, buffer.current.slice());
    })
    .onUpdate((e) => {
      if (!traitEnCours.current) return;
      buffer.current.push(versNorm(e.x, e.y));
      const maintenant = Date.now();
      if (maintenant - dernierEnvoi.current > 50) { // throttle ~50ms
        dernierEnvoi.current = maintenant;
        onTraitPoints && onTraitPoints(traitEnCours.current, buffer.current.splice(0));
      }
    })
    .onEnd(() => {
      if (buffer.current.length) onTraitPoints && onTraitPoints(traitEnCours.current, buffer.current.splice(0));
      onTraitFin && onTraitFin(traitEnCours.current);
      traitEnCours.current = null;
    });

  return (
    <View style={styles.zone} onLayout={(e) => setTaille({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <GestureDetector gesture={pan}>
        <Svg width="100%" height="100%">
          <Rect x="0" y="0" width="100%" height="100%" fill={fond} />
          {traits.map((t) => (
            <Path key={t.id} d={versChemin(t.points, taille_)} stroke={t.couleur} strokeWidth={t.taille}
              fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
      </GestureDetector>
    </View>
  );
}

// Convertit des points normalisés en attribut "d" d'un Path, à l'échelle du canvas.
function versChemin(points, { w, h }) {
  if (!points.length) return '';
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * w} ${y * h}`).join(' ');
}

const styles = StyleSheet.create({ zone: { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' } });
```
> Notes : la **gomme** = un trait de couleur `fond` (passer `couleur=fond` quand l'outil gomme est actif). Le rendu reconstruit chaque trait depuis ses points (les traits reçus du réseau sont accumulés par l'écran, voir Task F4). Pour limiter le poids, l'écran peut « simplifier » en ignorant les points trop proches (optionnel v1).
- [ ] **Step 2 :** Vérifier sur téléphone : on dessine, le trait suit le doigt.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(jeu): composant Canvas (capture + rendu)"`

### Task E2 : BarreOutils

**Files :** Create `src/composants/jeu/BarreOutils.js`.

- [ ] **Step 1 :** Palette (~16 couleurs), 3 tailles, boutons Gomme / Fond / Annuler / Effacer. Style selon la maquette v3 (grille de couleurs encadrée, boutons en bas). Props : `couleur, setCouleur, taille, setTaille, gommeActive, setGomme, onFond, onAnnuler, onEffacer`. Couleurs depuis un tableau local + `src/theme/couleurs`.
- [ ] **Step 2 : Commit** `git add -A && git commit -m "feat(jeu): barre d'outils de dessin"`

---

# PHASE F — Écran de jeu, sous-écrans, podium

### Task F1 : ChronoBar + TableauScores

**Files :** Create `src/composants/jeu/ChronoBar.js`, `src/composants/jeu/TableauScores.js`.

- [ ] **Step 1 :** `ChronoBar` : reçoit `duree` et un instant de départ ; affiche un compte à rebours local (barre qui se vide via Reanimated ou `setInterval`). N'est qu'un **affichage** (le serveur décide la vraie fin).
- [ ] **Step 2 :** `TableauScores` : reçoit `joueurs` (id, pseudo, mascotte, points) + `dessinateurId` + `ontTrouve` (Set) ; bande horizontale ; ✓ vert si trouvé, ✏️ si dessinateur. Réutiliser `Mascotte` en `taille` réduite `anime={false}`.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(jeu): ChronoBar + TableauScores"`

### Task F2 : ChoixMot + RevelationTour (sur-écrans)

**Files :** Create `src/composants/jeu/ChoixMot.js`, `src/composants/jeu/RevelationTour.js`.

- [ ] **Step 1 :** `ChoixMot` : overlay (Modal ou View absolue) avec 3 boutons mots ; `onChoisir(mot)`. Un petit compte à rebours visuel optionnel.
- [ ] **Step 2 :** `RevelationTour` : overlay affichant « Le mot était : MOT » + mini récap des points du tour ; se ferme tout seul (le serveur enchaîne au bout de ~5 s).
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat(jeu): sur-ecrans choix du mot + revelation"`

### Task F3 : ChatDevinettes

**Files :** Create `src/composants/jeu/ChatDevinettes.js`.

- [ ] **Step 1 :** Liste de messages (props `messages: [{type, pseudo, texte}]`) + champ de saisie + bouton envoyer → `onEnvoyer(texte)`. Styles selon la maquette (panneau encadré, bulles ; `found` vert, `close` jaune). Réutiliser un `ScrollView`/`FlatList` qui scrolle en bas.
- [ ] **Step 2 : Commit** `git add -A && git commit -m "feat(jeu): chat des devinettes"`

### Task F4 : EcranJeuDessin (orchestrateur)

**Files :** Modify `src/ecrans/EcranJeuDessin.js` (remplace le placeholder).

> C'est le chef d'orchestre **côté app**. Il s'abonne à tous les événements du jeu, tient l'état local (traits, scores, messages, rôle, mot/tirets, chrono) et compose : `TableauScores` + `Canvas` + (`BarreOutils` si dessinateur | `ChatDevinettes` si devineur) + overlays `ChoixMot`/`RevelationTour`. À `partieFinie` → `navigation.replace('Podium', { classement })`.

- [ ] **Step 1 :** Implémenter la logique d'abonnement (squelette directeur) :
```jsx
// extrait clé de EcranJeuDessin.js
useEffect(() => {
  const offs = [];
  offs.push(Reseau.sur('choixMots', (mots) => setChoixMots(mots)));         // je suis le dessinateur
  offs.push(Reseau.sur('tourDemarre', ({ dessinateurId, nbLettres, duree }) => {
    setDessinateurId(dessinateurId);
    setEstDessinateur(dessinateurId === monId);
    setTraits([]); setFond('#fff'); setOntTrouve(new Set());
    setTirets('_ '.repeat(nbLettres).trim()); setDebut(Date.now()); setDuree(duree); setChoixMots(null);
  }));
  offs.push(Reseau.sur('traitDebut', (t) => setTraits((p) => [...p, { ...t, points: [] }])));
  offs.push(Reseau.sur('traitPoints', ({ id, points }) => setTraits((p) => p.map((t) => t.id === id ? { ...t, points: [...t.points, ...points] } : t))));
  offs.push(Reseau.sur('annuler', () => setTraits((p) => p.slice(0, -1))));
  offs.push(Reseau.sur('effacerTout', () => setTraits([])));
  offs.push(Reseau.sur('fond', (c) => setFond(c)));
  offs.push(Reseau.sur('messageChat', (m) => ajouterMessage({ type: 'chat', ...m })));
  offs.push(Reseau.sur('aTrouve', ({ joueurId, pseudo }) => { setOntTrouve((s) => new Set(s).add(joueurId)); ajouterMessage({ type: 'found', pseudo }); }));
  offs.push(Reseau.sur('presque', ({ pseudo }) => ajouterMessage({ type: 'close', pseudo })));
  offs.push(Reseau.sur('scores', (s) => setScores(s)));
  offs.push(Reseau.sur('tourFini', ({ mot }) => setRevelation(mot)));
  offs.push(Reseau.sur('partieFinie', (classement) => navigation.replace('Podium', { classement })));
  offs.push(Reseau.sur('deconnecte', () => navigation.replace('Accueil')));
  return () => offs.forEach((off) => off());
}, []);
```
- [ ] **Step 2 :** Brancher les callbacks du `Canvas` (dessinateur) sur `Reseau.traitDebut/traitPoints/traitFin`, et `BarreOutils` sur `Reseau.annulerTrait/effacerTout/changerFond` (+ état local couleur/taille/gomme). **Important :** quand le dessinateur dessine, mettre AUSSI à jour ses propres `traits` localement (il ne reçoit pas ses propres messages relayés).
- [ ] **Step 3 :** Affichage du mot : dessinateur voit le vrai mot (depuis le mot choisi) ; devineurs voient les `tirets`.
- [ ] **Step 4 :** `ChoixMot` visible si `choixMots` non nul → `onChoisir` = `Reseau.choisirMot(mot)`.
- [ ] **Step 5 :** Vérifier sur téléphone (idéalement 2 appareils) : un dessine, l'autre voit en direct.
- [ ] **Step 6 : Commit** `git add -A && git commit -m "feat(jeu): ecran de jeu orchestrateur"`

### Task F5 : EcranPodium

**Files :** Create `src/ecrans/EcranPodium.js`, Modify `src/navigation/Navigation.js`.

- [ ] **Step 1 :** Afficher le `classement` (mascotte + pseudo + points), top 3 mis en avant 🥇🥈🥉, bouton « Retour à l'accueil » → `navigation.popToTop()` (et `Reseau.quitter()` si pertinent). Déclarer `Podium` dans la navigation.
- [ ] **Step 2 : Commit** `git add -A && git commit -m "feat(jeu): ecran podium"`

---

# PHASE G — Intégration & test réel

### Task G1 : Vérification complète

- [ ] **Step 1 :** `npm test` → tous les tests (base + jeu) au vert.
- [ ] **Step 2 :** Bundler : `npx expo export --platform android --output-dir _t && rmdir/del _t` (ou équivalent) → 0 erreur.
- [ ] **Step 3 :** Test manuel à 2+ téléphones (serveur Render) : régler → lancer → choisir un mot → dessin en direct → deviner (exact/proche/faux) → fin de tour (tous trouvés ET chrono) → enchaînement → podium.
- [ ] **Step 4 :** Déploiement : `git push origin main` (Render redéploie le serveur de jeu).
- [ ] **Step 5 :** Cocher les critères de réussite de la spec (§14).

---

## Critères de réussite (spec §14)
1. Réglages hôte → tous arrivent dans le jeu.
2. Choix du mot → dessin en direct visible par tous.
3. Bonne réponse = points (rapidité), sans révéler le mot ; dessinateur récompensé.
4. Fin de tour correcte (tous trouvés / chrono / dessinateur parti) + révélation.
5. Podium final pour tous.
6. Logique de partie couverte par tests.
7. Réseau centralisé dans `ClientReseau`.
