# BebouParty — Spécification de la base (v1)

**Date :** 2026-06-06
**Statut :** Validé en brainstorming, en attente de relecture
**Auteur :** Conçu avec l'utilisateur (débutant en code, francophone)

---

## 1. Objectif

Créer la **base** de BebouParty : un party game mobile multijoueur **local (WiFi partagé)** pour 8+ joueurs, chacun sur son propre téléphone, **en français uniquement**. Cette v1 livre la « coquille » complète et jouable jusqu'à la sélection du mini-jeu — le mini-jeu « Devine le dessin » lui-même viendra plus tard (écran « à venir » pour l'instant).

**Périmètre v1 :** 4 écrans + customizer de mascotte + réseau temps réel fonctionnel + serveur + README.
**Hors périmètre v1 :** le gameplay du dessin, le score, les comptes utilisateurs, toute base de données distante.

---

## 2. Décisions d'architecture clés

### 2.1 Réseau : serveur sur le PC, pas sur le téléphone

Le brief initial prévoyait que le téléphone de l'hôte devienne serveur WebSocket. **Ce n'est pas faisable avec Expo Go** (un téléphone sous Expo Go ne peut pas héberger de serveur réseau ; il faudrait un build natif personnalisé, trop complexe pour un débutant).

**Décision retenue :** un petit **serveur Node.js tourne sur le PC de l'utilisateur**, sur le même WiFi. **Tous** les téléphones (y compris celui de l'hôte) s'y connectent comme clients. L'hôte conserve son rôle de « chef » **au niveau du jeu** (il lance la partie et choisit le mini-jeu), mais techniquement il est un client comme les autres.

### 2.2 Module réseau découplé (futur-proof)

L'utilisateur veut pouvoir **un jour** passer à une architecture « téléphone-serveur » sans tout réécrire. Pour cela, **toute** la communication réseau est isolée dans un seul module (`src/reseau/ClientReseau.js`) exposant une API stable. Les écrans n'utilisent QUE cette API et ne voient jamais le WebSocket directement.

> Critère de réussite : changer d'architecture réseau ne doit toucher qu'au dossier `src/reseau/`, jamais les écrans ni les composants visuels.

---

## 3. Stack technique

| Besoin | Choix |
|---|---|
| Framework mobile | React Native via **Expo** (managed workflow) |
| Navigation | **React Navigation** (native-stack) |
| Réseau | **WebSocket** — serveur Node.js avec la bibliothèque `ws`, clients via l'API native `WebSocket` |
| Animations | **React Native Reanimated** |
| Persistance locale | **AsyncStorage** (sauvegarde du dernier profil : pseudo + mascotte) |
| Graphismes mascotte | **react-native-svg** (mascotte recombinable en SVG) |
| Polices | **Fredoka** + **Baloo 2** via `expo-font` / `@expo-google-fonts` |

---

## 4. Structure des fichiers

```
BebouParty/
├── App.js                         # point d'entrée : polices + navigation
├── app.json                       # config Expo
├── package.json
├── serveur/
│   └── serveur.js                 # serveur WebSocket Node.js (lancé sur le PC)
├── src/
│   ├── ecrans/
│   │   ├── EcranAccueil.js
│   │   ├── EcranProfil.js         # pseudo + customizer de mascotte
│   │   ├── EcranSalleAttente.js   # gère vue Hôte (3A) ET vue Joueur (3B)
│   │   └── EcranSelectionJeu.js
│   ├── composants/
│   │   ├── FondDegrade.js         # dégradé violet→rose + confettis
│   │   ├── BoutonPrincipal.js     # bouton candy (ombre colorée, reflet)
│   │   ├── CarteGlass.js          # panneau glassmorphism réutilisable
│   │   ├── Mascotte.js            # rend une mascotte depuis sa config
│   │   ├── SelecteurMascotte.js   # les 4 lignes à flèches (style skribbl)
│   │   ├── CarteJoueur.js         # avatar + pseudo dans la liste
│   │   └── CarteMiniJeu.js        # carte de la grille de jeux
│   ├── reseau/
│   │   └── ClientReseau.js        # SEULE porte vers le réseau (API découplée)
│   ├── theme/
│   │   ├── couleurs.js            # toutes les couleurs
│   │   └── styles.js              # styles partagés (rayons, ombres)
│   ├── donnees/
│   │   └── mascotte.js            # les listes d'options (créatures, tronches…)
│   └── etat/
│       └── ContexteJoueur.js      # contexte React : profil + état de session
└── README.md                      # guide d'installation en français
```

---

## 5. Le module réseau (`src/reseau/ClientReseau.js`)

API publique (les écrans n'utilisent que ça) :

| Fonction | Rôle |
|---|---|
| `connecter(adresseServeur)` | Ouvre la connexion WebSocket au serveur PC |
| `creerSalle(profil)` | Demande la création d'une salle ; reçoit un code (ex. `BEBOU-4829`) |
| `rejoindreSalle(code, profil)` | Rejoint une salle existante par son code |
| `lancerPartie()` | (hôte) signale le démarrage |
| `choisirJeu(idJeu)` | (hôte) signale le mini-jeu choisi |
| `quitter()` | Ferme proprement la connexion |
| `sur(evenement, callback)` | S'abonne aux événements entrants |

Événements reçus diffusés aux écrans via `sur(...)` :
`salleCreee`, `listeJoueurs`, `partieLancee`, `jeuChoisi`, `erreur`, `deconnecte`.

### Protocole de messages (JSON sur WebSocket)

Client → Serveur : `{ type, ... }`
- `CREER_SALLE` `{ profil }`
- `REJOINDRE_SALLE` `{ code, profil }`
- `LANCER_PARTIE` `{ }`
- `CHOISIR_JEU` `{ idJeu }`

Serveur → Client :
- `SALLE_CREEE` `{ code }`
- `LISTE_JOUEURS` `{ joueurs:[{id, pseudo, mascotte, estHote}] }`
- `PARTIE_LANCEE` `{ }`
- `JEU_CHOISI` `{ idJeu }`
- `ERREUR` `{ code:'SALLE_INTROUVABLE'|'SALLE_PLEINE'|..., message }`

`profil` = `{ pseudo, mascotte }`, où `mascotte = { creature, tronche, accessoire, couleur }` (indices ou clés des options).

---

## 6. Le serveur (`serveur/serveur.js`)

Programme Node.js (~120 lignes) lancé sur le PC via `node serveur/serveur.js`. Responsabilités :

- Écoute en WebSocket sur le **port 8080**.
- Maintient en mémoire un dictionnaire de salles : `{ code → { joueurs[], hoteId } }`.
- À `CREER_SALLE` : génère un code unique `BEBOU-XXXX`, crée la salle, marque le joueur comme hôte, renvoie `SALLE_CREEE` puis diffuse `LISTE_JOUEURS`.
- À `REJOINDRE_SALLE` : valide le code (sinon `ERREUR`), ajoute le joueur, **diffuse `LISTE_JOUEURS` à toute la salle**.
- À `LANCER_PARTIE` / `CHOISIR_JEU` (acceptés seulement de l'hôte) : diffuse `PARTIE_LANCEE` / `JEU_CHOISI` à toute la salle.
- À la déconnexion d'un socket : retire le joueur, rediffuse `LISTE_JOUEURS`. Si l'hôte part, la salle est fermée (`ERREUR` aux restants) — comportement simple v1.
- **Aucune persistance** : tout en mémoire, perdu à l'arrêt (conforme au « une partie = une session »).

---

## 7. Les écrans

### 7.1 Accueil (`EcranAccueil`)
- Logo « BEBOU PARTY » style autocollant (blanc + jaune, légèrement penché).
- Mascotte de démonstration animée.
- Slogan « Le party game entre amis ! ».
- Deux gros boutons candy : **« Créer une salle »** (violet) et **« Rejoindre une salle »** (rose).
- Animation d'entrée (fade + slide depuis le bas) sur tous les éléments.
- Les deux boutons mènent à l'écran Profil ; on retient l'intention (créer vs rejoindre).

### 7.2 Profil (`EcranProfil`)
- Titre « Qui es-tu ? ».
- Champ pseudo (placeholder « Ton surnom… »).
- **Customizer de mascotte façon skribbl.io** : 4 lignes à flèches `‹ ›` + bouton **🎲 Au hasard**, ~10 options chacune :
  - **Créature** (10), **Tronche/expression** (10), **Accessoire** (10), **Couleur** (10).
  - Mascotte mise à jour **en direct** et **animée** (flotte, se balance « ivre »).
- Bouton **« C'est parti ! »** (désactivé si pseudo vide).
- Le profil (pseudo + mascotte) est **sauvegardé en AsyncStorage** pour le réappliquer à la prochaine ouverture.
- Si intention = créer → `creerSalle()` puis Salle d'attente (mode hôte).
- Si intention = rejoindre → demander le **code de salle** (champ dédié), puis `rejoindreSalle()` → Salle d'attente (mode joueur).

### 7.3 Salle d'attente (`EcranSalleAttente`, deux modes)
Un seul fichier, deux variantes selon `estHote` :
- **Liste des joueurs** en temps réel (avatar mascotte + pseudo), via l'événement `listeJoueurs`.
- **Mode Hôte (3A)** : code de salle affiché **en grand** et partageable ; bouton **« Lancer la partie »** désactivé tant qu'il y a moins de 2 joueurs.
- **Mode Joueur (3B)** : message « En attente que l'hôte lance la partie… » + animation d'attente fun (mascottes qui sautillent).
- À réception de `partieLancee` : l'hôte va vers Sélection du jeu ; les joueurs vont vers un écran d'attente « L'hôte choisit le jeu… ».

### 7.4 Sélection du mini-jeu (`EcranSelectionJeu`, hôte seulement)
- Titre « Quel jeu on joue ? ».
- Grille 2 colonnes de `CarteMiniJeu` :
  - **Carte active** : « Devine le dessin » (icône pinceau, violet, « Dessine, les autres devinent ! »), animation scale au tap.
  - **7 cartes verrouillées** : « Bientôt disponible », grisées, cadenas 🔒, non cliquables.
- Au tap sur une carte active → `choisirJeu(id)` → le serveur diffuse `JEU_CHOISI` → **tous** les joueurs sont redirigés vers l'écran du jeu (v1 : un écran « Devine le dessin — à venir ! »).

---

## 8. Gestion des erreurs

- **Connexion perdue / serveur injoignable** : bandeau/écran rouge clair « Connexion au serveur perdue 😕 » + bouton **« Réessayer »**. Déclenché par l'événement `deconnecte`.
- **Code de salle invalide** : message « Cette salle n'existe pas » (depuis `ERREUR/SALLE_INTROUVABLE`).
- **Bouton « Lancer la partie »** grisé tant que `joueurs.length < 2`.
- L'adresse du serveur (IP du PC) est saisie/configurée au lancement (voir README) — un mauvais format affiche un message clair.

---

## 9. Direction artistique (validée par maquettes)

- **Couleurs** : fond dégradé violet `#7B2FBE` → rose `#E91E8C` ; accents violet `#8B5CF6`, rose `#EC4899`, cyan `#06B6D4` ; titres blanc / jaune `#FFD700`.
- **Panneaux** : glassmorphism (blanc 15–20 % + bordure blanche), coins 20–25 px.
- **Boutons** : couleur vive, ombre portée **colorée**, reflet brillant, coins très arrondis, scale au tap.
- **Polices** : **Fredoka** (texte) + **Baloo 2** (titres) — rondes et joufflues.
- **Mascotte** : créature **organique cursed** animée (float + wobble « gelée »), construite en SVG recombinable (créature / tronche / accessoire / couleur).
- **Ambiance** : joyeuse, énergique, soirée, décalée ; confettis flottants ; **pas** de minimalisme.
- **Animations** : entrée fade + slide depuis le bas (Reanimated) ; scale au tap sur les cartes.
- Maquettes de référence : `.superpowers/brainstorm/1411-1780777607/home-mockup.html` et `mascotte-v2.html`.

---

## 10. README (livrable)

Guide pas-à-pas **en français** pour un débutant :
1. Vérifier Node.js (déjà installé chez l'utilisateur).
2. Installer **Expo Go** sur le téléphone (iOS/Android).
3. Installer les dépendances (`npm install`).
4. **Lancer le serveur** sur le PC (`node serveur/serveur.js`).
5. Trouver l'**adresse IP locale** du PC (ex. `ipconfig` sous Windows).
6. **Lancer l'app** (`npx expo start`) et scanner le QR code avec Expo Go.
7. **Tester avec plusieurs téléphones** sur le même WiFi (renseigner l'IP du PC).
8. Section dépannage (pare-feu Windows, même WiFi, etc.).

---

## 11. Contraintes

- Tout le texte de l'interface **en français**.
- Compatible **iOS et Android** via Expo Go.
- Optimisé **téléphone** (pas tablette).
- **Aucun** compte, **aucune** base distante : tout local et temporaire (une partie = une session).
- Code **commenté en français** pour que l'utilisateur comprenne.

---

## 12. Critères de réussite (v1)

1. Depuis 2+ téléphones sur le même WiFi, on peut créer/rejoindre une salle et **voir la liste des joueurs se mettre à jour en temps réel**.
2. L'hôte peut lancer la partie ; tous les joueurs sont redirigés ; l'hôte choisit « Devine le dessin » et **tout le monde** arrive sur l'écran du jeu.
3. L'app respecte la **direction artistique** validée (dégradé, glassmorphism, mascotte cursed animée, customizer 4 axes).
4. Couper le serveur affiche un **message d'erreur clair** côté téléphones.
5. Changer d'architecture réseau ne nécessiterait de toucher qu'à `src/reseau/`.
