# Plan d'implémentation — BebouParty (base v1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire la base jouable de BebouParty — 4 écrans (Accueil, Profil, Salle d'attente, Sélection du jeu) + customizer de mascotte SVG + serveur WebSocket local + module réseau découplé — jusqu'à la redirection de tous les joueurs vers le mini-jeu.

**Architecture :** App React Native (Expo) où tous les téléphones sont des **clients** d'un petit serveur Node.js (`ws`) tournant sur le PC, même WiFi. Toute la logique réseau passe par un module unique et découplé (`src/reseau/`). La logique pure (gestion des salles, protocole de messages) est extraite dans des fichiers testables en TDD ; les écrans sont vérifiés visuellement dans Expo Go.

**Tech Stack :** Expo, React Navigation (native-stack), WebSocket (`ws` côté serveur, `WebSocket` natif côté app), react-native-reanimated, react-native-svg, expo-linear-gradient, AsyncStorage, polices Google Fredoka + Baloo 2, Jest (jest-expo) pour les tests.

**Note pour l'exécutant :** l'utilisateur est débutant. Garde le code **commenté en français**, des noms de variables en français, et explique les commandes à lancer. À chaque fin de phase, montre à l'utilisateur comment voir le résultat sur son téléphone.

---

## Conventions

- **Commits fréquents** : un commit par tâche terminée. Messages en français, préfixe `feat:`/`test:`/`chore:`/`docs:`.
- **TDD** (phases serveur & réseau) : test rouge → code minimal → test vert → commit.
- **UI** (écrans/composants visuels) : créer le fichier → recharger l'app dans Expo Go → vérifier à l'œil → commit. (Pas de test automatisé d'UI en v1, c'est volontaire pour rester accessible.)
- Couleurs et constantes **toujours** importées depuis `src/theme/` — jamais de valeur en dur dans les écrans.
- Le réseau **toujours** via `src/reseau/ClientReseau.js` — aucun écran ne touche `WebSocket` directement.

---

## Carte des fichiers (responsabilité unique)

| Fichier | Responsabilité |
|---|---|
| `App.js` | Charge les polices, monte la navigation et le contexte joueur |
| `src/navigation/Navigation.js` | Déclare la pile d'écrans (native-stack) |
| `src/theme/couleurs.js` | Palette + dégradés |
| `src/theme/styles.js` | Rayons, ombres colorées, helpers de style partagés |
| `src/composants/FondDegrade.js` | Fond dégradé violet→rose + confettis flottants |
| `src/composants/CarteGlass.js` | Panneau glassmorphism réutilisable |
| `src/composants/BoutonPrincipal.js` | Bouton « candy » (ombre colorée, reflet, scale au tap) |
| `src/donnees/mascotte.js` | Les 4 listes d'options (créatures, tronches, accessoires, couleurs) — **données pures** |
| `src/composants/Mascotte.js` | Rend une mascotte (react-native-svg) depuis une config |
| `src/composants/SelecteurMascotte.js` | Les 4 lignes à flèches + bouton 🎲 |
| `src/composants/CarteJoueur.js` | Une entrée de la liste de joueurs (mascotte + pseudo) |
| `src/composants/CarteMiniJeu.js` | Une carte de la grille de jeux (active ou verrouillée) |
| `serveur/salles.js` | **Logique pure** de gestion des salles (testée TDD) |
| `serveur/serveur.js` | Câblage WebSocket autour de `salles.js` |
| `src/reseau/protocole.js` | **Logique pure** : construire/parser les messages (testée TDD) |
| `src/reseau/ClientReseau.js` | Connexion WebSocket + émetteur d'événements (seule porte réseau) |
| `src/etat/ContexteJoueur.js` | Contexte React : profil + état de session (code, joueurs, rôle) |
| `src/ecrans/EcranAccueil.js` | Logo, mascotte, 2 boutons, adresse du serveur |
| `src/ecrans/EcranProfil.js` | Pseudo + customizer + création/rejoint de salle |
| `src/ecrans/EcranSalleAttente.js` | Vue hôte (3A) et vue joueur (3B) |
| `src/ecrans/EcranSelectionJeu.js` | Grille de mini-jeux (hôte) |
| `src/ecrans/EcranAttenteJeu.js` | « L'hôte choisit le jeu… » (joueurs) |
| `src/ecrans/EcranJeuDessin.js` | Placeholder « Devine le dessin — à venir ! » |
| `README.md` | Guide d'installation et de test en français |

---

# PHASE 0 — Mise en place du projet

### Task 0.1 : Créer le projet Expo et initialiser Git

**Files :** racine du projet.

- [ ] **Step 1 :** Depuis `X:\CLAUDEGOAT\`, créer l'app dans le dossier existant (ou un sous-dossier puis déplacer). Recommandé : créer à côté puis copier, ou utiliser le dossier courant.

Run :
```bash
cd X:/CLAUDEGOAT
npx create-expo-app@latest BebouParty --template blank
```
> Si le dossier `BebouParty` existe déjà et contient `docs/`, créer dans un dossier temporaire `BebouTmp` puis copier `App.js`, `package.json`, `app.json`, `babel.config.js`, `.gitignore` dans `BebouParty/`. Conserver le dossier `docs/` existant.

Expected : un projet Expo « blank » fonctionnel.

- [ ] **Step 2 :** Initialiser Git (pour permettre les commits du plan).

Run :
```bash
cd X:/CLAUDEGOAT/BebouParty
git init
git add -A
git commit -m "chore: scaffold projet Expo BebouParty"
```
Expected : premier commit créé.

- [ ] **Step 3 :** Lancer l'app pour vérifier l'outillage.

Run : `npx expo start`
Expected : un QR code s'affiche. (L'utilisateur le scannera avec Expo Go — voir README plus tard.) Arrêter avec `Ctrl+C`.

---

### Task 0.2 : Installer toutes les dépendances

**Files :** `package.json`.

- [ ] **Step 1 :** Installer les libs runtime via Expo (versions compatibles auto).

Run :
```bash
npx expo install react-native-svg react-native-reanimated @react-native-async-storage/async-storage expo-linear-gradient react-native-screens react-native-safe-area-context expo-font
npm install @react-navigation/native @react-navigation/native-stack
npm install @expo-google-fonts/fredoka @expo-google-fonts/baloo-2
```

- [ ] **Step 2 :** Installer la dépendance serveur et les outils de test.

Run :
```bash
npm install ws
npm install --save-dev jest jest-expo @testing-library/react-native react-test-renderer
```

- [ ] **Step 3 :** Activer le plugin Reanimated dans `babel.config.js`.

```js
// babel.config.js — Reanimated DOIT être le dernier plugin
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 4 :** Configurer Jest dans `package.json` (ajouter ces clés) :

```json
"scripts": {
  "start": "expo start",
  "test": "jest",
  "serveur": "node serveur/serveur.js"
},
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))"
  ]
}
```

- [ ] **Step 5 :** Vérifier que Jest tourne (aucun test encore → message « no tests found » accepté).

Run : `npm test`
Expected : Jest démarre sans erreur de config.

- [ ] **Step 6 : Commit**
```bash
git add -A
git commit -m "chore: installer dépendances (navigation, svg, reanimated, ws, jest)"
```

---

# PHASE 1 — Thème et fondations visuelles

### Task 1.1 : Palette de couleurs

**Files :** Create `src/theme/couleurs.js`.

- [ ] **Step 1 :** Créer le fichier.

```js
// src/theme/couleurs.js
// Toutes les couleurs de BebouParty au même endroit.
// Pour changer l'ambiance de l'app, on ne touche qu'ici.

export const COULEURS = {
  // Dégradé de fond principal (violet -> rose)
  fondHaut: '#7B2FBE',
  fondMilieu: '#9B2EB0',
  fondBas: '#E91E8C',

  // Accents
  violet: '#8B5CF6',
  violetFonce: '#7C3AED',
  rose: '#EC4899',
  roseFonce: '#DB2777',
  cyan: '#06B6D4',

  // Textes
  blanc: '#FFFFFF',
  jaune: '#FFD700',
  texteDoux: 'rgba(255,255,255,0.8)',

  // Verre (glassmorphism)
  verre: 'rgba(255,255,255,0.15)',
  verreBordure: 'rgba(255,255,255,0.40)',

  // Divers
  ombreNoire: 'rgba(0,0,0,0.18)',
  erreur: '#EF4444',
  verrou: 'rgba(255,255,255,0.25)',
};

// Le dégradé prêt à l'emploi pour expo-linear-gradient
export const DEGRADE_FOND = [COULEURS.fondHaut, COULEURS.fondMilieu, COULEURS.fondBas];
```

- [ ] **Step 2 : Commit** `git add -A && git commit -m "feat: palette de couleurs"`

---

### Task 1.2 : Styles partagés (rayons, ombres colorées)

**Files :** Create `src/theme/styles.js`.

- [ ] **Step 1 :** Créer le fichier.

```js
// src/theme/styles.js
// Helpers de style réutilisés partout : coins arrondis et ombres colorées.
import { COULEURS } from './couleurs';

export const RAYONS = { carte: 24, bouton: 22, petit: 14 };

// Fabrique une ombre portée COLORÉE (pas grise) à partir d'une couleur.
export function ombreColoree(couleur) {
  return {
    shadowColor: couleur,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10, // Android
  };
}

export const POLICES = {
  titre: 'Baloo2_800ExtraBold',
  titreMoyen: 'Baloo2_700Bold',
  texte: 'Fredoka_500Medium',
  texteGras: 'Fredoka_600SemiBold',
};
```

- [ ] **Step 2 : Commit** `git add -A && git commit -m "feat: styles partagés (rayons, ombres, polices)"`

---

### Task 1.3 : Charger les polices dans App.js

**Files :** Modify `App.js`.

- [ ] **Step 1 :** Remplacer `App.js` par une version qui charge les polices et affiche un écran provisoire.

```jsx
// App.js
import React from 'react';
import { View, Text } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { COULEURS } from './src/theme/couleurs';

export default function App() {
  // useFonts renvoie false tant que les polices ne sont pas prêtes
  const [policesPretes] = useFonts({
    Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold,
    Baloo2_700Bold, Baloo2_800ExtraBold,
  });

  if (!policesPretes) {
    return <View style={{ flex: 1, backgroundColor: COULEURS.fondHaut }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COULEURS.fondHaut, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, color: COULEURS.jaune }}>
        BebouParty
      </Text>
    </View>
  );
}
```

- [ ] **Step 2 :** Recharger l'app (Expo) → vérifier que « BebouParty » s'affiche en jaune avec une police ronde.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: chargement des polices Fredoka/Baloo"`

---

### Task 1.4 : Composant FondDegrade (avec confettis)

**Files :** Create `src/composants/FondDegrade.js`.

- [ ] **Step 1 :** Créer le composant : dégradé + confettis qui tombent en boucle (Reanimated).

```jsx
// src/composants/FondDegrade.js
// Fond réutilisé par TOUS les écrans : dégradé violet->rose + confettis animés.
import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { DEGRADE_FOND } from '../theme/couleurs';

const { height } = Dimensions.get('window');
const EMOJIS = ['⭐', '✨', '🎉', '🍬', '🎈'];

// Un confetti qui tombe en boucle
function Confetti({ gauche, emoji, duree, delai }) {
  const y = useSharedValue(-40);
  useEffect(() => {
    y.value = withRepeat(withTiming(height + 40, { duration: duree, easing: Easing.linear }), -1);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.Text style={[styles.confetti, { left: gauche }, style]}>{emoji}</Animated.Text>
  );
}

export default function FondDegrade({ children }) {
  return (
    <LinearGradient colors={DEGRADE_FOND} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.fond}>
      {/* Quelques confettis décoratifs */}
      {[...Array(6)].map((_, i) => (
        <Confetti key={i} gauche={`${8 + i * 15}%`} emoji={EMOJIS[i % EMOJIS.length]} duree={6000 + i * 800} delai={i * 500} />
      ))}
      <SafeAreaView style={styles.contenu}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  contenu: { flex: 1, paddingHorizontal: 22 },
  confetti: { position: 'absolute', top: 0, fontSize: 18, opacity: 0.8 },
});
```

- [ ] **Step 2 :** Provisoirement, envelopper le contenu de `App.js` dans `<FondDegrade>` pour vérifier le rendu (dégradé + confettis qui tombent).
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: composant FondDegrade avec confettis animés"`

---

### Task 1.5 : Composant CarteGlass (glassmorphism)

**Files :** Create `src/composants/CarteGlass.js`.

- [ ] **Step 1 :**

```jsx
// src/composants/CarteGlass.js
// Panneau translucide (glassmorphism) réutilisable.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COULEURS } from '../theme/couleurs';
import { RAYONS } from '../theme/styles';

export default function CarteGlass({ children, style }) {
  return <View style={[styles.carte, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: COULEURS.verre,
    borderColor: COULEURS.verreBordure,
    borderWidth: 1.5,
    borderRadius: RAYONS.carte,
    padding: 18,
  },
});
```

- [ ] **Step 2 : Commit** `git add -A && git commit -m "feat: composant CarteGlass"`

---

### Task 1.6 : Composant BoutonPrincipal (candy)

**Files :** Create `src/composants/BoutonPrincipal.js`.

- [ ] **Step 1 :** Bouton avec couleur, ombre colorée, reflet, et petit scale au tap (Reanimated).

```jsx
// src/composants/BoutonPrincipal.js
import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COULEURS } from '../theme/couleurs';
import { RAYONS, ombreColoree, POLICES } from '../theme/styles';

// couleur = couleur vive du bouton ; ombre = couleur de l'ombre portée
export default function BoutonPrincipal({ titre, sousTitre, icone, couleur, ombre, onPress, desactive }) {
  const echelle = useSharedValue(1);
  const styleAnim = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));

  return (
    <Animated.View style={[styleAnim, ombreColoree(ombre || couleur), { opacity: desactive ? 0.5 : 1 }]}>
      <Pressable
        disabled={desactive}
        onPressIn={() => (echelle.value = withSpring(0.96))}
        onPressOut={() => (echelle.value = withSpring(1))}
        onPress={onPress}
        style={[styles.bouton, { backgroundColor: couleur }]}
      >
        {icone ? <Text style={styles.icone}>{icone}</Text> : null}
        <Text style={styles.titre}>{titre}</Text>
        {sousTitre ? <Text style={styles.sousTitre}>{sousTitre}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bouton: { borderRadius: RAYONS.bouton, paddingVertical: 18, paddingHorizontal: 22, alignItems: 'center' },
  icone: { fontSize: 26, marginBottom: 4 },
  titre: { fontFamily: POLICES.texteGras, fontSize: 20, color: COULEURS.blanc },
  sousTitre: { fontFamily: POLICES.texte, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});
```

- [ ] **Step 2 :** Vérifier visuellement (placer 2 boutons dans App.js provisoirement).
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: composant BoutonPrincipal (candy)"`

---

# PHASE 2 — Données et mascotte

### Task 2.1 : Données des options de mascotte

**Files :** Create `src/donnees/mascotte.js`, Test `src/donnees/__tests__/mascotte.test.js`.

> On reprend exactement les listes validées dans les maquettes (`.superpowers/brainstorm/.../mascotte-v2.html`). Les formes SVG (chemins `d`, snippets) sont **réutilisées telles quelles**.

- [ ] **Step 1 : Écrire le test** (vérifie qu'on a bien 10 options par axe et des champs requis).

```js
// src/donnees/__tests__/mascotte.test.js
import { CREATURES, TRONCHES, ACCESSOIRES, COULEURS_MASCOTTE, mascotteAleatoire } from '../mascotte';

test('chaque axe propose 10 options', () => {
  expect(CREATURES).toHaveLength(10);
  expect(TRONCHES).toHaveLength(10);
  expect(ACCESSOIRES).toHaveLength(10);
  expect(COULEURS_MASCOTTE).toHaveLength(10);
});

test('chaque créature a un nom et un chemin SVG', () => {
  for (const c of CREATURES) {
    expect(typeof c.nom).toBe('string');
    expect(typeof c.d).toBe('string');
  }
});

test('mascotteAleatoire renvoie des indices valides', () => {
  const m = mascotteAleatoire();
  expect(m.creature).toBeGreaterThanOrEqual(0);
  expect(m.creature).toBeLessThan(10);
  expect(m).toHaveProperty('tronche');
  expect(m).toHaveProperty('accessoire');
  expect(m).toHaveProperty('couleur');
});
```

- [ ] **Step 2 : Run** `npm test -- mascotte` → Expected : FAIL (module introuvable).

- [ ] **Step 3 : Implémenter** `src/donnees/mascotte.js` en transcrivant les listes de la maquette. Structure :

```js
// src/donnees/mascotte.js
// Données PURES des options de mascotte. Réutilisées par le composant Mascotte
// et le sélecteur. Les chemins SVG viennent des maquettes validées.

export const CREATURES = [
  { nom: 'Blob',       d: 'M100 44 C150 44 172 86 166 126 C160 168 134 188 100 188 C66 188 40 168 34 126 C28 86 50 44 100 44Z' },
  { nom: 'Goutte',     d: 'M100 24 C120 70 168 96 166 132 C164 168 134 188 100 188 C66 188 36 168 34 132 C32 96 80 70 100 24Z' },
  { nom: 'Patate',     d: 'M96 46 C140 40 178 74 174 122 C171 162 150 188 100 188 C58 188 26 168 26 124 C26 82 54 52 96 46Z' },
  { nom: 'Haricot',    d: 'M120 44 C166 52 178 104 158 140 C142 170 152 188 110 188 C70 188 40 170 36 132 C32 96 50 92 62 78 C74 64 84 40 120 44Z' },
  { nom: 'Caillou',    d: 'M70 50 L130 46 C168 60 176 96 168 130 C160 170 130 188 96 188 C58 188 30 168 28 128 C26 92 40 62 70 50Z' },
  { nom: 'Méduse',     d: 'M100 46 C146 46 168 84 168 116 C168 132 160 140 150 140 C150 152 158 160 150 170 C144 178 136 168 134 160 C130 176 120 182 116 168 C110 184 96 184 92 168 C86 182 76 178 72 162 C66 174 56 168 56 156 C50 162 44 152 50 140 C40 138 32 130 32 116 C32 84 54 46 100 46Z' },
  { nom: 'Flaque',     d: 'M100 68 C150 68 182 92 182 124 C182 152 168 162 150 164 C152 174 144 180 138 172 C132 182 120 180 118 170 C110 182 96 184 90 170 C82 182 70 178 68 168 C56 174 42 166 48 154 C26 152 18 138 18 122 C18 92 50 68 100 68Z' },
  { nom: 'Œuf bancal', d: 'M110 28 C148 34 164 80 160 128 C156 168 130 188 96 188 C62 188 40 166 42 124 C44 78 72 22 110 28Z' },
  { nom: 'Champi',     d: 'M38 96 C38 54 70 38 100 38 C130 38 162 54 162 96 C162 110 150 114 136 114 L130 180 C130 186 122 188 114 188 L86 188 C78 188 70 186 70 180 L64 114 C50 114 38 110 38 96Z' },
  { nom: 'Oursin',     d: 'M100 44 L108 28 L116 46 L130 32 L130 52 C158 60 172 92 168 124 C162 166 134 188 100 188 C66 188 38 166 32 124 C28 92 42 60 70 52 L70 32 L84 46 L92 28 L100 44Z' },
];

export const COULEURS_MASCOTTE = [
  { nom: 'Violet', valeur: '#9B7BFF' }, { nom: 'Rose', valeur: '#F875B8' },
  { nom: 'Cyan', valeur: '#3DD6E8' },   { nom: 'Jaune', valeur: '#FFD24A' },
  { nom: 'Lime', valeur: '#A3E635' },   { nom: 'Corail', valeur: '#FF8A8A' },
  { nom: 'Orange', valeur: '#FFA94D' }, { nom: 'Bleu', valeur: '#6BA6FF' },
  { nom: 'Lavande', valeur: '#C4B5FD' },{ nom: 'Magenta', valeur: '#F472D0' },
];

// TRONCHES et ACCESSOIRES : chaque option fournit une fonction qui rend des
// éléments react-native-svg. On les définit dans Mascotte.js (besoin des
// composants Svg). Ici on ne garde que les NOMS pour le sélecteur + le total.
export const TRONCHES = [
  { nom: 'Mignon' }, { nom: 'Louche' }, { nom: 'Langue pendante' }, { nom: 'KO (x_x)' },
  { nom: 'Sourcil unique' }, { nom: 'Psychopathe' }, { nom: 'Choqué' }, { nom: 'Clin d’œil' },
  { nom: 'Blasé' }, { nom: 'Dents du bonheur' },
];

export const ACCESSOIRES = [
  { nom: 'Aucun' }, { nom: 'Lunettes de fête' }, { nom: 'Couronne' }, { nom: 'Chapeau de fête' },
  { nom: 'Corne licorne' }, { nom: 'Auréole' }, { nom: 'Antennes' }, { nom: 'Bob' },
  { nom: 'Casquette' }, { nom: 'Cocktail' },
];

export function mascotteAleatoire() {
  const r = (n) => Math.floor(Math.random() * n);
  return { creature: r(CREATURES.length), tronche: r(TRONCHES.length), accessoire: r(ACCESSOIRES.length), couleur: r(COULEURS_MASCOTTE.length) };
}

export const MASCOTTE_DEFAUT = { creature: 2, tronche: 2, accessoire: 1, couleur: 4 };
```

- [ ] **Step 4 : Run** `npm test -- mascotte` → Expected : PASS.
- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat: données des options de mascotte (+ tests)"`

---

### Task 2.2 : Composant Mascotte (rendu SVG animé)

**Files :** Create `src/composants/Mascotte.js`.

> Transcrit la mascotte de la maquette en **react-native-svg**. Les tronches et accessoires sont rendus par des fonctions internes (switch sur l'indice). L'animation « float + wobble » se fait avec Reanimated sur un conteneur.

- [ ] **Step 1 :** Créer `src/composants/Mascotte.js`.

```jsx
// src/composants/Mascotte.js
// Rend une mascotte à partir d'une config { creature, tronche, accessoire, couleur }.
// Optionnellement animée (flotte + se balance comme de la gelée).
import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import Svg, { Path, Ellipse, Circle, Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { CREATURES, COULEURS_MASCOTTE } from '../donnees/mascotte';

const D = '#2A1B47'; // contour foncé

// --- Les 10 tronches (yeux ~ x80/x120, y98 ; bouche ~ y120) ---
function rendreTronche(i) {
  switch (i) {
    case 0: return (<G>{/* Mignon */}
      <Ellipse cx="80" cy="98" rx="14" ry="16" fill="#fff" /><Ellipse cx="120" cy="98" rx="14" ry="16" fill="#fff" />
      <Circle cx="83" cy="101" r="7" fill={D} /><Circle cx="117" cy="101" r="7" fill={D} />
      <Circle cx="58" cy="116" r="9" fill="#FF8FC7" opacity="0.7" /><Circle cx="142" cy="116" r="9" fill="#FF8FC7" opacity="0.7" />
      <Path d="M92 118 Q100 126 108 118" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" /></G>);
    case 2: return (<G>{/* Langue pendante */}
      <Path d="M68 96 q12 -7 24 0" stroke={D} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d="M108 96 q12 -7 24 0" stroke={D} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Circle cx="80" cy="104" r="5" fill={D} /><Circle cx="120" cy="104" r="5" fill={D} />
      <Path d="M96 119 Q100 119 104 119 L104 136 Q100 142 96 136 Z" fill="#FF6FA0" stroke={D} strokeWidth="2" /></G>);
    case 3: return (<G>{/* KO x_x */}
      <Path d="M72 91 L88 105 M88 91 L72 105" stroke={D} strokeWidth="4" strokeLinecap="round" />
      <Path d="M112 91 L128 105 M128 91 L112 105" stroke={D} strokeWidth="4" strokeLinecap="round" />
      <Path d="M90 122 Q95 117 100 122 Q105 127 110 122" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" /></G>);
    // ... cases 1,4,5,6,7,8,9 : transcrire les autres tronches de la maquette mascotte-v2.html
    default: return rendreTronche(0);
  }
}

// --- Les 10 accessoires ---
function rendreAccessoire(i, couleur) {
  switch (i) {
    case 0: return null; // Aucun
    case 1: return (<G>{/* Lunettes de fête */}
      <Rect x="58" y="88" width="84" height="22" rx="9" fill="#1f1330" />
      <Rect x="61" y="90" width="36" height="9" rx="4" fill="#06B6D4" />
      <Rect x="103" y="90" width="36" height="9" rx="4" fill="#EC4899" /></G>);
    case 9: return (<SvgText x="136" y="60" fontSize="40">🍹</SvgText>); // Cocktail
    // ... cases 2..8 : transcrire couronne, chapeau de fête, corne, auréole, antennes, bob, casquette
    default: return null;
  }
}

export default function Mascotte({ config, taille = 180, anime = true }) {
  const c = config || { creature: 0, tronche: 0, accessoire: 0, couleur: 0 };
  const couleur = COULEURS_MASCOTTE[c.couleur].valeur;

  const flotte = useSharedValue(0);
  const balance = useSharedValue(0);
  useEffect(() => {
    if (!anime) return;
    flotte.value = withRepeat(withSequence(
      withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      withTiming(6, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
    ), -1);
    balance.value = withRepeat(withSequence(
      withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
    ), -1);
  }, [anime]);
  const styleAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: flotte.value }, { rotate: `${balance.value}deg` }],
  }));

  return (
    <Animated.View style={anime ? styleAnim : null}>
      <Svg width={taille} height={taille} viewBox="0 0 200 205">
        <Ellipse cx="100" cy="197" rx="50" ry="8" fill="rgba(0,0,0,0.18)" />
        <Path d={CREATURES[c.creature].d} fill={couleur} stroke="rgba(42,27,71,0.22)" strokeWidth="3" />
        <Ellipse cx="122" cy="70" rx="13" ry="17" fill="rgba(255,255,255,0.18)" />
        {rendreTronche(c.tronche)}
        {rendreAccessoire(c.accessoire, couleur)}
      </Svg>
    </Animated.View>
  );
}
```

> **Important pour l'exécutant :** compléter TOUS les `case` manquants (tronches 1,4–9 ; accessoires 2–8) en transcrivant fidèlement les snippets SVG de `mascotte-v2.html` (convertir attributs `stroke-width`→`strokeWidth`, `stroke-linecap`→`strokeLinecap`, etc.). Les antennes utilisent la couleur du corps (`fill={couleur}`).

- [ ] **Step 2 :** Afficher `<Mascotte config={MASCOTTE_DEFAUT} />` dans App.js provisoirement → vérifier qu'elle s'affiche et bouge.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: composant Mascotte SVG animé"`

---

### Task 2.3 : Composant SelecteurMascotte (4 lignes à flèches + 🎲)

**Files :** Create `src/composants/SelecteurMascotte.js`.

- [ ] **Step 1 :** Créer le sélecteur. Reçoit `config` et `onChange(nouvelleConfig)`.

```jsx
// src/composants/SelecteurMascotte.js
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CREATURES, TRONCHES, ACCESSOIRES, COULEURS_MASCOTTE, mascotteAleatoire } from '../donnees/mascotte';
import { COULEURS } from '../theme/couleurs';
import { POLICES, RAYONS } from '../theme/styles';

const AXES = [
  { cle: 'creature', label: 'Créature', liste: CREATURES },
  { cle: 'tronche', label: 'Tronche', liste: TRONCHES },
  { cle: 'accessoire', label: 'Accessoire', liste: ACCESSOIRES },
  { cle: 'couleur', label: 'Couleur', liste: COULEURS_MASCOTTE },
];

function Ligne({ axe, valeurIndex, onCycle }) {
  const item = axe.liste[valeurIndex];
  return (
    <View style={styles.ligne}>
      <Text style={styles.label}>{axe.label}</Text>
      <View style={styles.picker}>
        <Pressable style={styles.fleche} onPress={() => onCycle(-1)}><Text style={styles.flecheTxt}>‹</Text></Pressable>
        <View style={styles.valeurZone}>
          {axe.cle === 'couleur' && <View style={[styles.pastille, { backgroundColor: item.valeur }]} />}
          <Text style={styles.valeur}>{item.nom}</Text>
          <Text style={styles.idx}>{valeurIndex + 1}/{axe.liste.length}</Text>
        </View>
        <Pressable style={styles.fleche} onPress={() => onCycle(1)}><Text style={styles.flecheTxt}>›</Text></Pressable>
      </View>
    </View>
  );
}

export default function SelecteurMascotte({ config, onChange }) {
  const cycler = (cle, liste, dir) => {
    const n = liste.length;
    onChange({ ...config, [cle]: (config[cle] + dir + n) % n });
  };
  return (
    <View style={{ gap: 10 }}>
      {AXES.map((axe) => (
        <Ligne key={axe.cle} axe={axe} valeurIndex={config[axe.cle]} onCycle={(d) => cycler(axe.cle, axe.liste, d)} />
      ))}
      <Pressable style={styles.hasard} onPress={() => onChange(mascotteAleatoire())}>
        <Text style={styles.hasardTxt}>🎲 Au hasard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { backgroundColor: COULEURS.verre, borderColor: COULEURS.verreBordure, borderWidth: 1.5, borderRadius: 18, padding: 8, flexDirection: 'row', alignItems: 'center' },
  label: { width: 90, color: COULEURS.jaune, fontFamily: POLICES.texteGras, fontSize: 12, textTransform: 'uppercase', paddingLeft: 6 },
  picker: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fleche: { width: 36, height: 36, borderRadius: 12, backgroundColor: COULEURS.verrou, alignItems: 'center', justifyContent: 'center' },
  flecheTxt: { color: COULEURS.blanc, fontSize: 20, fontFamily: POLICES.texteGras },
  valeurZone: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valeur: { color: COULEURS.blanc, fontFamily: POLICES.texteGras, fontSize: 14 },
  idx: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  pastille: { width: 16, height: 16, borderRadius: 8 },
  hasard: { backgroundColor: COULEURS.verre, borderColor: COULEURS.verreBordure, borderWidth: 1.5, borderRadius: RAYONS.bouton, padding: 14, alignItems: 'center' },
  hasardTxt: { color: COULEURS.blanc, fontFamily: POLICES.texteGras, fontSize: 16 },
});
```

- [ ] **Step 2 :** Tester dans App.js : un état `config` + `<Mascotte config={config}/>` + `<SelecteurMascotte config={config} onChange={setConfig}/>` → vérifier que les flèches et le 🎲 changent la mascotte en direct.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: SelecteurMascotte (style skribbl)"`

---

# PHASE 3 — Serveur WebSocket (TDD)

### Task 3.1 : Logique pure des salles (TDD)

**Files :** Create `serveur/salles.js`, Test `serveur/__tests__/salles.test.js`.

- [ ] **Step 1 : Écrire les tests.**

```js
// serveur/__tests__/salles.test.js
const { GestionnaireSalles } = require('../salles');

test('creerSalle génère un code BEBOU-XXXX et ajoute l’hôte', () => {
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

test('estHote indique si un socket est l’hôte de sa salle', () => {
  const g = new GestionnaireSalles();
  const { code } = g.creerSalle('sock1', { pseudo: 'Léa', mascotte: {} });
  expect(g.estHote('sock1')).toBe(true);
  g.rejoindreSalle('sock2', code, { pseudo: 'Max', mascotte: {} });
  expect(g.estHote('sock2')).toBe(false);
});
```

- [ ] **Step 2 : Run** `npm test -- salles` → Expected : FAIL.

- [ ] **Step 3 : Implémenter** `serveur/salles.js`.

```js
// serveur/salles.js
// Logique PURE de gestion des salles (aucun WebSocket ici → facile à tester).
class GestionnaireSalles {
  constructor() {
    this.salles = {};        // code -> { hoteSocket, joueurs: [{ socketId, pseudo, mascotte, estHote }] }
    this.socketVersCode = {}; // socketId -> code (pour retrouver vite la salle)
  }

  genererCode() {
    let code;
    do { code = 'BEBOU-' + Math.floor(1000 + Math.random() * 9000); } while (this.salles[code]);
    return code;
  }

  creerSalle(socketId, profil) {
    const code = this.genererCode();
    const joueur = { socketId, pseudo: profil.pseudo, mascotte: profil.mascotte, estHote: true };
    this.salles[code] = { hoteSocket: socketId, joueurs: [joueur] };
    this.socketVersCode[socketId] = code;
    return { code, joueur };
  }

  rejoindreSalle(socketId, code, profil) {
    const salle = this.salles[code];
    if (!salle) return { ok: false, code: 'SALLE_INTROUVABLE' };
    const joueur = { socketId, pseudo: profil.pseudo, mascotte: profil.mascotte, estHote: false };
    salle.joueurs.push(joueur);
    this.socketVersCode[socketId] = code;
    return { ok: true, codeSalle: code };
  }

  retirer(socketId) {
    const code = this.socketVersCode[socketId];
    if (!code || !this.salles[code]) return null;
    const salle = this.salles[code];
    salle.joueurs = salle.joueurs.filter((j) => j.socketId !== socketId);
    delete this.socketVersCode[socketId];
    const hotePartiOuVide = salle.hoteSocket === socketId || salle.joueurs.length === 0;
    if (hotePartiOuVide) { delete this.salles[code]; return { code, ferme: true }; }
    return { code, ferme: false };
  }

  codeDuSocket(socketId) { return this.socketVersCode[socketId]; }
  estHote(socketId) {
    const code = this.socketVersCode[socketId];
    return !!code && this.salles[code] && this.salles[code].hoteSocket === socketId;
  }
  listeJoueurs(code) {
    return this.salles[code] ? this.salles[code].joueurs.map(({ socketId, ...reste }) => ({ id: socketId, ...reste })) : [];
  }
  socketsDe(code) { return this.salles[code] ? this.salles[code].joueurs.map((j) => j.socketId) : []; }
}

module.exports = { GestionnaireSalles };
```

- [ ] **Step 4 : Run** `npm test -- salles` → Expected : PASS.
- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat: logique pure des salles (TDD)"`

---

### Task 3.2 : Câblage WebSocket du serveur

**Files :** Create `serveur/serveur.js`.

- [ ] **Step 1 :** Écrire le serveur autour de `GestionnaireSalles`.

```js
// serveur/serveur.js
// Serveur WebSocket à lancer sur le PC : node serveur/serveur.js
const { WebSocketServer } = require('ws');
const { GestionnaireSalles } = require('./salles');

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });
const gestion = new GestionnaireSalles();

// On donne un identifiant à chaque connexion
let prochainId = 1;

function envoyer(ws, type, donnees = {}) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, ...donnees }));
}

// Diffuse un message à TOUS les joueurs d'une salle
function diffuser(code, type, donnees = {}) {
  for (const ws of wss.clients) {
    if (ws.codeSalle === code) envoyer(ws, type, donnees);
  }
}

function diffuserListe(code) {
  diffuser(code, 'LISTE_JOUEURS', { joueurs: gestion.listeJoueurs(code) });
}

wss.on('connection', (ws) => {
  ws.idSocket = 'S' + prochainId++;
  console.log('Connexion', ws.idSocket);

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.type === 'CREER_SALLE') {
      const { code } = gestion.creerSalle(ws.idSocket, msg.profil);
      ws.codeSalle = code;
      envoyer(ws, 'SALLE_CREEE', { code });
      diffuserListe(code);
    }

    else if (msg.type === 'REJOINDRE_SALLE') {
      const r = gestion.rejoindreSalle(ws.idSocket, msg.code, msg.profil);
      if (!r.ok) { envoyer(ws, 'ERREUR', { code: r.code, message: 'Cette salle n’existe pas' }); return; }
      ws.codeSalle = r.codeSalle;
      diffuserListe(r.codeSalle);
    }

    else if (msg.type === 'LANCER_PARTIE') {
      if (gestion.estHote(ws.idSocket)) diffuser(ws.codeSalle, 'PARTIE_LANCEE');
    }

    else if (msg.type === 'CHOISIR_JEU') {
      if (gestion.estHote(ws.idSocket)) diffuser(ws.codeSalle, 'JEU_CHOISI', { idJeu: msg.idJeu });
    }
  });

  ws.on('close', () => {
    const r = gestion.retirer(ws.idSocket);
    if (r && !r.ferme) diffuserListe(r.code);
    if (r && r.ferme) diffuser(r.code, 'ERREUR', { code: 'SALLE_FERMEE', message: 'L’hôte a quitté la partie' });
  });
});

console.log(`Serveur BebouParty démarré sur le port ${PORT}`);
```

- [ ] **Step 2 :** Lancer le serveur et vérifier le message de démarrage.

Run : `npm run serveur`
Expected : `Serveur BebouParty démarré sur le port 8080`. Laisser tourner, `Ctrl+C` pour arrêter.

- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: serveur WebSocket (création/rejoint/diffusion)"`

---

# PHASE 4 — Module réseau côté app

### Task 4.1 : Protocole (TDD)

**Files :** Create `src/reseau/protocole.js`, Test `src/reseau/__tests__/protocole.test.js`.

- [ ] **Step 1 : Tests.**

```js
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
```

- [ ] **Step 2 : Run** `npm test -- protocole` → FAIL.

- [ ] **Step 3 : Implémenter.**

```js
// src/reseau/protocole.js
// Fonctions pures pour fabriquer et lire les messages réseau (JSON).
export function construire(type, donnees = {}) {
  return JSON.stringify({ type, ...donnees });
}
export function parser(texte) {
  try { return JSON.parse(texte); } catch { return null; }
}
```

- [ ] **Step 4 : Run** `npm test -- protocole` → PASS.
- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat: protocole réseau (TDD)"`

---

### Task 4.2 : ClientReseau (la seule porte vers le réseau)

**Files :** Create `src/reseau/ClientReseau.js`.

- [ ] **Step 1 :** Implémenter un petit émetteur d'événements + connexion WebSocket.

```js
// src/reseau/ClientReseau.js
// SEULE porte vers le réseau. Les écrans n'utilisent QUE ces fonctions.
// Pour passer un jour à une architecture "téléphone-serveur", on ne modifiera
// que ce fichier.
import { construire, parser } from './protocole';

let socket = null;
const abonnes = {}; // evenement -> [callbacks]

function emettre(evenement, donnees) {
  (abonnes[evenement] || []).forEach((cb) => cb(donnees));
}

// S'abonner à un événement entrant. Renvoie une fonction pour se désabonner.
export function sur(evenement, callback) {
  if (!abonnes[evenement]) abonnes[evenement] = [];
  abonnes[evenement].push(callback);
  return () => { abonnes[evenement] = abonnes[evenement].filter((c) => c !== callback); };
}

// adresse = "192.168.1.20:8080"
export function connecter(adresse) {
  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(`ws://${adresse}`);
    } catch (e) { reject(e); return; }

    socket.onopen = () => resolve();
    socket.onerror = () => { emettre('deconnecte'); reject(new Error('connexion impossible')); };
    socket.onclose = () => emettre('deconnecte');
    socket.onmessage = (ev) => {
      const msg = parser(ev.data);
      if (!msg) return;
      // On traduit chaque message serveur en événement clair pour les écrans
      switch (msg.type) {
        case 'SALLE_CREEE': emettre('salleCreee', msg); break;
        case 'LISTE_JOUEURS': emettre('listeJoueurs', msg.joueurs); break;
        case 'PARTIE_LANCEE': emettre('partieLancee'); break;
        case 'JEU_CHOISI': emettre('jeuChoisi', msg.idJeu); break;
        case 'ERREUR': emettre('erreur', msg); break;
      }
    };
  });
}

function envoyer(type, donnees) {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(construire(type, donnees));
}

export function creerSalle(profil) { envoyer('CREER_SALLE', { profil }); }
export function rejoindreSalle(code, profil) { envoyer('REJOINDRE_SALLE', { code, profil }); }
export function lancerPartie() { envoyer('LANCER_PARTIE'); }
export function choisirJeu(idJeu) { envoyer('CHOISIR_JEU', { idJeu }); }
export function quitter() { if (socket) socket.close(); socket = null; }
```

- [ ] **Step 2 : Commit** `git add -A && git commit -m "feat: ClientReseau (porte réseau découplée)"`

---

### Task 4.3 : Contexte joueur (état partagé)

**Files :** Create `src/etat/ContexteJoueur.js`.

- [ ] **Step 1 :** Un contexte React qui garde le profil et l'état de session, + persistance AsyncStorage du profil.

```jsx
// src/etat/ContexteJoueur.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MASCOTTE_DEFAUT } from '../donnees/mascotte';

const Contexte = createContext(null);
const CLE = '@bebou_profil';

export function FournisseurJoueur({ children }) {
  const [pseudo, setPseudo] = useState('');
  const [mascotte, setMascotte] = useState(MASCOTTE_DEFAUT);
  const [adresseServeur, setAdresseServeur] = useState('192.168.1.10:8080');

  // Recharger le dernier profil au démarrage
  useEffect(() => {
    AsyncStorage.getItem(CLE).then((txt) => {
      if (!txt) return;
      try {
        const p = JSON.parse(txt);
        if (p.pseudo) setPseudo(p.pseudo);
        if (p.mascotte) setMascotte(p.mascotte);
        if (p.adresseServeur) setAdresseServeur(p.adresseServeur);
      } catch {}
    });
  }, []);

  const sauverProfil = () => AsyncStorage.setItem(CLE, JSON.stringify({ pseudo, mascotte, adresseServeur }));

  const valeur = { pseudo, setPseudo, mascotte, setMascotte, adresseServeur, setAdresseServeur, sauverProfil, profil: { pseudo, mascotte } };
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useJoueur() { return useContext(Contexte); }
```

- [ ] **Step 2 : Commit** `git add -A && git commit -m "feat: contexte joueur + persistance AsyncStorage"`

---

# PHASE 5 — Navigation et écrans

### Task 5.1 : Pile de navigation + branchement App.js

**Files :** Create `src/navigation/Navigation.js`, Modify `App.js`.

- [ ] **Step 1 :** Créer la navigation.

```jsx
// src/navigation/Navigation.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EcranAccueil from '../ecrans/EcranAccueil';
import EcranProfil from '../ecrans/EcranProfil';
import EcranSalleAttente from '../ecrans/EcranSalleAttente';
import EcranSelectionJeu from '../ecrans/EcranSelectionJeu';
import EcranAttenteJeu from '../ecrans/EcranAttenteJeu';
import EcranJeuDessin from '../ecrans/EcranJeuDessin';

const Pile = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Pile.Navigator screenOptions={{ headerShown: false }}>
        <Pile.Screen name="Accueil" component={EcranAccueil} />
        <Pile.Screen name="Profil" component={EcranProfil} />
        <Pile.Screen name="SalleAttente" component={EcranSalleAttente} />
        <Pile.Screen name="SelectionJeu" component={EcranSelectionJeu} />
        <Pile.Screen name="AttenteJeu" component={EcranAttenteJeu} />
        <Pile.Screen name="JeuDessin" component={EcranJeuDessin} />
      </Pile.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 2 :** Mettre `App.js` final (polices + contexte + navigation).

```jsx
// App.js
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { FournisseurJoueur } from './src/etat/ContexteJoueur';
import Navigation from './src/navigation/Navigation';
import { COULEURS } from './src/theme/couleurs';

export default function App() {
  const [policesPretes] = useFonts({ Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold });
  if (!policesPretes) return <View style={{ flex: 1, backgroundColor: COULEURS.fondHaut }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FournisseurJoueur>
          <Navigation />
        </FournisseurJoueur>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

> Si `react-native-gesture-handler` manque : `npx expo install react-native-gesture-handler`.

- [ ] **Step 3 :** Recharger → l'app doit afficher l'écran Accueil (créé à la tâche suivante ; en attendant, créer des écrans vides qui renvoient `<FondDegrade/>`).
- [ ] **Step 4 : Commit** `git add -A && git commit -m "feat: navigation + branchement App"`

---

### Task 5.2 : Écran Accueil

**Files :** Create `src/ecrans/EcranAccueil.js`.

- [ ] **Step 1 :** Logo, mascotte animée, slogan, champ « adresse du serveur », 2 boutons. Animation d'entrée (fade + slide).

```jsx
// src/ecrans/EcranAccueil.js
import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FondDegrade from '../composants/FondDegrade';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import Mascotte from '../composants/Mascotte';
import CarteGlass from '../composants/CarteGlass';
import { useJoueur } from '../etat/ContexteJoueur';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';
import { MASCOTTE_DEFAUT } from '../donnees/mascotte';

export default function EcranAccueil({ navigation }) {
  const { adresseServeur, setAdresseServeur } = useJoueur();

  // intention = 'creer' ou 'rejoindre' (passée à l'écran Profil)
  const aller = (intention) => navigation.navigate('Profil', { intention });

  return (
    <FondDegrade>
      <View style={styles.centre}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.logo}>BEBOU</Text>
          <Text style={styles.logo2}>PARTY ⚡</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Mascotte config={MASCOTTE_DEFAUT} taille={170} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(400).springify()} style={styles.slogan}>
          Le party game entre amis !
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(550).springify()} style={{ width: '100%', gap: 14 }}>
          <BoutonPrincipal titre="Créer une salle" sousTitre="Sois l'hôte de la partie" icone="➕"
            couleur={COULEURS.violet} ombre={COULEURS.violet} onPress={() => aller('creer')} />
          <BoutonPrincipal titre="Rejoindre une salle" sousTitre="Entre le code d'un ami" icone="🔑"
            couleur={COULEURS.rose} ombre={COULEURS.rose} onPress={() => aller('rejoindre')} />

          <CarteGlass style={{ padding: 12 }}>
            <Text style={styles.petitLabel}>Adresse du PC-serveur</Text>
            <TextInput value={adresseServeur} onChangeText={setAdresseServeur}
              placeholder="192.168.1.10:8080" placeholderTextColor="rgba(255,255,255,0.5)"
              autoCapitalize="none" style={styles.input} />
          </CarteGlass>
        </Animated.View>
      </View>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { fontFamily: POLICES.titre, fontSize: 58, color: COULEURS.blanc, textAlign: 'center', transform: [{ rotate: '-3deg' }] },
  logo2: { fontFamily: POLICES.titre, fontSize: 40, color: COULEURS.jaune, textAlign: 'center', marginTop: -8, transform: [{ rotate: '-3deg' }] },
  slogan: { fontFamily: POLICES.texte, fontSize: 18, color: COULEURS.blanc, marginVertical: 6 },
  petitLabel: { fontFamily: POLICES.texte, fontSize: 12, color: COULEURS.jaune, marginBottom: 4 },
  input: { fontFamily: POLICES.texteGras, fontSize: 16, color: COULEURS.blanc, paddingVertical: 6 },
});
```

- [ ] **Step 2 :** Recharger → vérifier logo, mascotte qui bouge, boutons, champ adresse. Vérifier l'animation d'entrée.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: écran Accueil"`

---

### Task 5.3 : Écran Profil (pseudo + customizer + connexion)

**Files :** Create `src/ecrans/EcranProfil.js`.

- [ ] **Step 1 :** Composer l'écran. Selon `intention`, après « C'est parti ! » : créer la salle, ou afficher un champ code puis rejoindre.

```jsx
// src/ecrans/EcranProfil.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteGlass from '../composants/CarteGlass';
import Mascotte from '../composants/Mascotte';
import SelecteurMascotte from '../composants/SelecteurMascotte';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import { useJoueur } from '../etat/ContexteJoueur';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function EcranProfil({ route, navigation }) {
  const intention = route.params?.intention || 'creer';
  const { pseudo, setPseudo, mascotte, setMascotte, adresseServeur, sauverProfil, profil } = useJoueur();
  const [code, setCode] = useState('');
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    if (!pseudo.trim()) { Alert.alert('Oups', 'Choisis d\'abord un surnom !'); return; }
    if (intention === 'rejoindre' && !code.trim()) { Alert.alert('Oups', 'Entre le code de la salle.'); return; }
    setEnCours(true);
    await sauverProfil();
    try {
      await Reseau.connecter(adresseServeur);
    } catch {
      setEnCours(false);
      Alert.alert('Connexion impossible', 'Vérifie l\'adresse du serveur et le WiFi.');
      return;
    }
    if (intention === 'creer') {
      const off = Reseau.sur('salleCreee', ({ code }) => {
        off();
        navigation.replace('SalleAttente', { estHote: true, code });
      });
      Reseau.creerSalle(profil);
    } else {
      // On écoute une éventuelle erreur "salle introuvable"
      const offErr = Reseau.sur('erreur', (e) => { offErr(); setEnCours(false); Alert.alert('Erreur', e.message); });
      Reseau.rejoindreSalle(code.trim().toUpperCase(), profil);
      navigation.replace('SalleAttente', { estHote: false, code: code.trim().toUpperCase() });
    }
  };

  return (
    <FondDegrade>
      <ScrollView contentContainerStyle={{ paddingVertical: 10, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.titre}>Qui es-tu ?</Text>
        <View style={{ alignItems: 'center' }}><Mascotte config={mascotte} taille={150} /></View>

        <CarteGlass style={{ padding: 12 }}>
          <TextInput value={pseudo} onChangeText={setPseudo} placeholder="Ton surnom..."
            placeholderTextColor="rgba(255,255,255,0.5)" style={styles.input} />
        </CarteGlass>

        <SelecteurMascotte config={mascotte} onChange={setMascotte} />

        {intention === 'rejoindre' && (
          <CarteGlass style={{ padding: 12 }}>
            <Text style={styles.label}>Code de la salle</Text>
            <TextInput value={code} onChangeText={setCode} placeholder="BEBOU-0000" autoCapitalize="characters"
              placeholderTextColor="rgba(255,255,255,0.5)" style={styles.input} />
          </CarteGlass>
        )}

        <BoutonPrincipal titre={enCours ? 'Connexion...' : "C'est parti !"} icone="🎉"
          couleur={COULEURS.violet} onPress={valider} desactive={enCours} />
      </ScrollView>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: POLICES.titre, fontSize: 30, color: COULEURS.jaune, textAlign: 'center' },
  label: { fontFamily: POLICES.texte, fontSize: 12, color: COULEURS.jaune, marginBottom: 4 },
  input: { fontFamily: POLICES.texteGras, fontSize: 18, color: COULEURS.blanc, paddingVertical: 6 },
});
```

- [ ] **Step 2 :** Recharger → vérifier pseudo + customizer fonctionnel + (mode rejoindre) champ code.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: écran Profil (pseudo + customizer + connexion)"`

---

### Task 5.4 : Composant CarteJoueur + Écran Salle d'attente

**Files :** Create `src/composants/CarteJoueur.js`, Create `src/ecrans/EcranSalleAttente.js`.

- [ ] **Step 1 :** `CarteJoueur` (mascotte miniature non animée + pseudo + badge hôte).

```jsx
// src/composants/CarteJoueur.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Mascotte from './Mascotte';
import CarteGlass from './CarteGlass';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function CarteJoueur({ joueur }) {
  return (
    <CarteGlass style={styles.carte}>
      <Mascotte config={joueur.mascotte} taille={54} anime={false} />
      <Text style={styles.pseudo} numberOfLines={1}>{joueur.pseudo}</Text>
      {joueur.estHote && <Text style={styles.hote}>👑 Hôte</Text>}
    </CarteGlass>
  );
}
const styles = StyleSheet.create({
  carte: { alignItems: 'center', padding: 10, width: 100 },
  pseudo: { fontFamily: POLICES.texteGras, fontSize: 14, color: COULEURS.blanc, marginTop: 4 },
  hote: { fontFamily: POLICES.texte, fontSize: 11, color: COULEURS.jaune },
});
```

- [ ] **Step 2 :** `EcranSalleAttente` (gère hôte ET joueur, écoute `listeJoueurs` + `partieLancee`).

```jsx
// src/ecrans/EcranSalleAttente.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteGlass from '../composants/CarteGlass';
import CarteJoueur from '../composants/CarteJoueur';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function EcranSalleAttente({ route, navigation }) {
  const { estHote, code } = route.params;
  const [joueurs, setJoueurs] = useState([]);

  useEffect(() => {
    const off1 = Reseau.sur('listeJoueurs', setJoueurs);
    const off2 = Reseau.sur('partieLancee', () => {
      navigation.replace(estHote ? 'SelectionJeu' : 'AttenteJeu');
    });
    const off3 = Reseau.sur('erreur', () => navigation.replace('Accueil'));
    const off4 = Reseau.sur('deconnecte', () => navigation.replace('Accueil'));
    return () => { off1(); off2(); off3(); off4(); };
  }, []);

  const assezDeJoueurs = joueurs.length >= 2;

  return (
    <FondDegrade>
      <View style={{ flex: 1, paddingTop: 10 }}>
        {estHote ? (
          <CarteGlass style={styles.codeBox}>
            <Text style={styles.codeLabel}>Code de la salle</Text>
            <Text style={styles.code}>{code}</Text>
            <Text style={styles.partage}>Partage-le avec tes amis !</Text>
          </CarteGlass>
        ) : (
          <Text style={styles.attente}>En attente que l'hôte lance la partie...</Text>
        )}

        <Text style={styles.compteur}>{joueurs.length} joueur(s) connecté(s)</Text>
        <FlatList data={joueurs} keyExtractor={(j) => j.id} numColumns={3}
          columnWrapperStyle={{ gap: 10, justifyContent: 'center' }}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          renderItem={({ item }) => <CarteJoueur joueur={item} />} />

        {estHote && (
          <BoutonPrincipal titre="Lancer la partie" icone="🚀" couleur={COULEURS.violet}
            desactive={!assezDeJoueurs} onPress={() => Reseau.lancerPartie()} />
        )}
        {estHote && !assezDeJoueurs && <Text style={styles.info}>Il faut au moins 2 joueurs</Text>}
      </View>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  codeBox: { alignItems: 'center', marginBottom: 14 },
  codeLabel: { fontFamily: POLICES.texte, fontSize: 13, color: COULEURS.texteDoux },
  code: { fontFamily: POLICES.titre, fontSize: 40, color: COULEURS.jaune, letterSpacing: 2 },
  partage: { fontFamily: POLICES.texte, fontSize: 13, color: COULEURS.blanc },
  attente: { fontFamily: POLICES.titreMoyen, fontSize: 20, color: COULEURS.blanc, textAlign: 'center', marginBottom: 14 },
  compteur: { fontFamily: POLICES.texteGras, fontSize: 15, color: COULEURS.blanc, textAlign: 'center', marginBottom: 10 },
  info: { fontFamily: POLICES.texte, fontSize: 13, color: COULEURS.texteDoux, textAlign: 'center', marginTop: 6 },
});
```

- [ ] **Step 3 :** Recharger. (Le test réel multi-joueurs se fait en Phase 7.)
- [ ] **Step 4 : Commit** `git add -A && git commit -m "feat: salle d'attente (hôte + joueur) + CarteJoueur"`

---

### Task 5.5 : CarteMiniJeu + Écran Sélection du jeu + écrans d'attente/jeu

**Files :** Create `src/composants/CarteMiniJeu.js`, `src/ecrans/EcranSelectionJeu.js`, `src/ecrans/EcranAttenteJeu.js`, `src/ecrans/EcranJeuDessin.js`.

- [ ] **Step 1 :** `CarteMiniJeu` (active avec scale au tap, ou verrouillée grisée + cadenas).

```jsx
// src/composants/CarteMiniJeu.js
import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COULEURS } from '../theme/couleurs';
import { RAYONS, POLICES, ombreColoree } from '../theme/styles';

export default function CarteMiniJeu({ jeu, onPress }) {
  const echelle = useSharedValue(1);
  const styleAnim = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  const verrou = jeu.verrouille;
  return (
    <Animated.View style={[styleAnim, !verrou && ombreColoree(jeu.couleur), { flex: 1 }]}>
      <Pressable disabled={verrou}
        onPressIn={() => !verrou && (echelle.value = withSpring(0.95))}
        onPressOut={() => !verrou && (echelle.value = withSpring(1))}
        onPress={onPress}
        style={[styles.carte, { backgroundColor: verrou ? 'rgba(255,255,255,0.12)' : jeu.couleur, opacity: verrou ? 0.6 : 1 }]}>
        <Text style={styles.icone}>{verrou ? '🔒' : jeu.icone}</Text>
        <Text style={styles.nom}>{verrou ? 'Bientôt disponible' : jeu.nom}</Text>
        {!verrou && <Text style={styles.desc}>{jeu.description}</Text>}
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  carte: { borderRadius: RAYONS.carte, padding: 16, minHeight: 130, justifyContent: 'center', alignItems: 'center' },
  icone: { fontSize: 34, marginBottom: 6 },
  nom: { fontFamily: POLICES.titreMoyen, fontSize: 16, color: COULEURS.blanc, textAlign: 'center' },
  desc: { fontFamily: POLICES.texte, fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4 },
});
```

- [ ] **Step 2 :** `EcranSelectionJeu` (grille 2 colonnes, 1 actif + 7 verrouillés).

```jsx
// src/ecrans/EcranSelectionJeu.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteMiniJeu from '../composants/CarteMiniJeu';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

const JEUX = [
  { id: 'dessin', nom: 'Devine le dessin', icone: '🖌️', couleur: COULEURS.violet, description: 'Dessine, les autres devinent !', verrouille: false },
  ...[...Array(7)].map((_, i) => ({ id: 'verrou' + i, verrouille: true })),
];

export default function EcranSelectionJeu({ navigation }) {
  useEffect(() => {
    const off = Reseau.sur('jeuChoisi', () => navigation.replace('JeuDessin'));
    return off;
  }, []);

  const choisir = (jeu) => { Reseau.choisirJeu(jeu.id); /* le serveur renverra JEU_CHOISI à tous */ };

  return (
    <FondDegrade>
      <Text style={styles.titre}>Quel jeu on joue ?</Text>
      <FlatList data={JEUX} keyExtractor={(j) => j.id} numColumns={2}
        columnWrapperStyle={{ gap: 12 }} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}
        renderItem={({ item }) => <CarteMiniJeu jeu={item} onPress={() => choisir(item)} />} />
    </FondDegrade>
  );
}
const styles = StyleSheet.create({
  titre: { fontFamily: POLICES.titre, fontSize: 28, color: COULEURS.jaune, textAlign: 'center', marginVertical: 10 },
});
```

- [ ] **Step 3 :** `EcranAttenteJeu` (joueurs, pendant que l'hôte choisit).

```jsx
// src/ecrans/EcranAttenteJeu.js
import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import Mascotte from '../composants/Mascotte';
import * as Reseau from '../reseau/ClientReseau';
import { useJoueur } from '../etat/ContexteJoueur';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function EcranAttenteJeu({ navigation }) {
  const { mascotte } = useJoueur();
  useEffect(() => {
    const off = Reseau.sur('jeuChoisi', () => navigation.replace('JeuDessin'));
    return off;
  }, []);
  return (
    <FondDegrade>
      <View style={styles.c}>
        <Mascotte config={mascotte} taille={160} />
        <Text style={styles.txt}>L'hôte choisit le jeu...</Text>
      </View>
    </FondDegrade>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  txt: { fontFamily: POLICES.titreMoyen, fontSize: 20, color: COULEURS.blanc },
});
```

- [ ] **Step 4 :** `EcranJeuDessin` (placeholder).

```jsx
// src/ecrans/EcranJeuDessin.js
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function EcranJeuDessin() {
  return (
    <FondDegrade>
      <View style={styles.c}>
        <Text style={styles.emoji}>🖌️</Text>
        <Text style={styles.titre}>Devine le dessin</Text>
        <Text style={styles.txt}>Ce mini-jeu arrive bientôt !</Text>
      </View>
    </FondDegrade>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji: { fontSize: 64 },
  titre: { fontFamily: POLICES.titre, fontSize: 30, color: COULEURS.jaune },
  txt: { fontFamily: POLICES.texte, fontSize: 16, color: COULEURS.blanc },
});
```

- [ ] **Step 5 : Commit** `git add -A && git commit -m "feat: sélection du jeu + écrans attente/jeu placeholder"`

---

# PHASE 6 — Intégration temps réel & gestion d'erreurs

### Task 6.1 : Bandeau de déconnexion global

**Files :** Create `src/composants/BandeauErreur.js`, Modify les écrans concernés (ou l'enrouler dans `FondDegrade`).

- [ ] **Step 1 :** Créer un petit bandeau rouge réutilisable affiché sur `deconnecte`.

```jsx
// src/composants/BandeauErreur.js
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function BandeauErreur({ onReessayer }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const off = Reseau.sur('deconnecte', () => setVisible(true));
    return off;
  }, []);
  if (!visible) return null;
  return (
    <View style={styles.bandeau}>
      <Text style={styles.txt}>Connexion au serveur perdue 😕</Text>
      {onReessayer && <Pressable onPress={onReessayer}><Text style={styles.lien}>Réessayer</Text></Pressable>}
    </View>
  );
}
const styles = StyleSheet.create({
  bandeau: { position: 'absolute', top: 40, left: 16, right: 16, backgroundColor: COULEURS.erreur, borderRadius: 14, padding: 12, alignItems: 'center', zIndex: 100 },
  txt: { fontFamily: POLICES.texteGras, color: COULEURS.blanc, fontSize: 14 },
  lien: { fontFamily: POLICES.texteGras, color: COULEURS.jaune, fontSize: 14, marginTop: 4 },
});
```

- [ ] **Step 2 :** Ajouter `<BandeauErreur onReessayer={() => navigation.replace('Accueil')} />` dans Salle d'attente, Sélection du jeu, Attente jeu.
- [ ] **Step 3 : Commit** `git add -A && git commit -m "feat: bandeau de déconnexion"`

---

### Task 6.2 : Vérification du flux complet (un seul appareil + serveur)

**Files :** aucun (vérification).

- [ ] **Step 1 :** Lancer le serveur (`npm run serveur`) sur le PC.
- [ ] **Step 2 :** Lancer l'app (`npx expo start`), ouvrir dans Expo Go, renseigner l'adresse `IP_DU_PC:8080`.
- [ ] **Step 3 :** Créer une salle → vérifier le code affiché et « 1 joueur connecté ».
- [ ] **Step 4 :** Vérifier que « Lancer la partie » est grisé (1 seul joueur). 
- [ ] **Step 5 :** Couper le serveur → vérifier le bandeau « Connexion perdue ».
- [ ] **Step 6 :** (Pas de commit — étape de test.)

---

# PHASE 7 — Documentation et test multi-téléphones

### Task 7.1 : README en français

**Files :** Create `README.md`.

- [ ] **Step 1 :** Écrire un README pas-à-pas couvrant : prérequis (Node OK), installation Expo Go, `npm install`, lancer le serveur, trouver l'IP du PC (`ipconfig`), `npx expo start`, scanner le QR, renseigner l'IP dans l'app, test multi-téléphones même WiFi, et **dépannage** (pare-feu Windows à autoriser sur le port 8080, vérifier le même réseau WiFi, format `IP:8080`).

```markdown
# 🍬 BebouParty

Party game multijoueur local (WiFi) — chacun sur son téléphone.

## 1. Prérequis
- **Node.js** (déjà installé ✅) — vérifie avec `node --version`.
- L'app **Expo Go** sur ton téléphone (App Store / Google Play).
- Ton **ordinateur et tes téléphones sur le MÊME WiFi**.

## 2. Installation (une seule fois)
Dans le dossier du projet :
```
npm install
```

## 3. Lancer une partie
### a) Démarrer le serveur (sur le PC)
```
npm run serveur
```
Laisse cette fenêtre ouverte (« Serveur BebouParty démarré sur le port 8080 »).

### b) Trouver l'adresse IP de ton PC
- Windows : ouvre un terminal, tape `ipconfig`, repère « Adresse IPv4 » (ex. `192.168.1.10`).

### c) Lancer l'application
Dans une autre fenêtre :
```
npx expo start
```
Scanne le QR code avec Expo Go.

### d) Sur chaque téléphone
- Dans l'app, renseigne l'adresse du serveur : `192.168.1.10:8080` (ton IP + `:8080`).
- Un joueur **crée** la salle (il devient hôte) et partage le code.
- Les autres **rejoignent** avec le code.

## 4. Dépannage
- **« Connexion impossible »** : vérifie l'IP, le `:8080`, et que tout le monde est sur le même WiFi.
- **Le pare-feu Windows** peut bloquer : autorise Node.js sur les réseaux privés (une fenêtre le propose au 1er lancement).
- Le serveur **oublie tout à l'arrêt** : une partie = une session.
```

- [ ] **Step 2 : Commit** `git add -A && git commit -m "docs: README installation et test"`

---

### Task 7.2 : Test réel avec 2+ téléphones

**Files :** aucun (validation des critères de réussite).

- [ ] **Step 1 :** Serveur lancé, 2 téléphones (ou + ) sur le même WiFi, IP renseignée.
- [ ] **Step 2 :** Téléphone A crée la salle ; téléphone B rejoint → **vérifier que la liste se met à jour en temps réel des deux côtés**.
- [ ] **Step 3 :** « Lancer la partie » s'active à 2 joueurs ; l'hôte lance → B arrive sur « L'hôte choisit le jeu… ».
- [ ] **Step 4 :** L'hôte choisit « Devine le dessin » → **A et B** arrivent sur l'écran du jeu.
- [ ] **Step 5 :** Couper le serveur → message d'erreur clair sur les deux.
- [ ] **Step 6 :** Cocher les critères de réussite de la spec (§12).

---

## Récapitulatif des critères de réussite (spec §12)

1. ✅ Liste des joueurs en temps réel sur 2+ téléphones.
2. ✅ Lancement → redirection de tous → choix du jeu → tous sur l'écran du jeu.
3. ✅ Direction artistique respectée (dégradé, glass, mascotte cursed animée, customizer 4 axes).
4. ✅ Coupure serveur → message clair.
5. ✅ Changer le réseau ne touche qu'à `src/reseau/`.
