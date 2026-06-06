# 🍬 BebouParty

**Le party game entre amis !** — un jeu de soirée multijoueur où chacun joue depuis son propre téléphone, sur le même WiFi.

> Cette version est la **base** de l'app : accueil, création de ta mascotte, salle d'attente en temps réel et choix du mini-jeu. Le mini-jeu « Devine le dessin » arrivera dans une prochaine étape.

---

## 🧩 Comment ça marche (en 1 image mentale)

```
   📱 Hôte ─┐
   📱 Ami 1 ─┤──►  💻 Ton PC (le "serveur", même WiFi)  ──►  synchronise tout le monde
   📱 Ami 2 ─┘
```

- Ton **ordinateur** fait tourner un petit programme « serveur » (le cerveau de la partie).
- **Tous les téléphones** (le tien y compris) se connectent à ce serveur via le WiFi.
- Quand quelqu'un rejoint, ou que l'hôte lance la partie, tout le monde est mis à jour **en temps réel**.

Rien n'est enregistré : quand tu fermes le serveur, la partie disparaît. Pas de compte, pas d'internet nécessaire (juste le WiFi local).

---

## 1. Ce qu'il te faut (une seule fois)

1. **Node.js** — déjà installé chez toi ✅. Pour vérifier, ouvre un terminal et tape :
   ```
   node --version
   ```
   (un numéro comme `v24.x` doit s'afficher)

2. L'application **Expo Go** sur ton téléphone :
   - iPhone → App Store → cherche **« Expo Go »**
   - Android → Google Play → cherche **« Expo Go »**

3. **Important :** ton ordinateur ET tous les téléphones doivent être sur le **même réseau WiFi**.

---

## 2. Installation du projet (une seule fois)

Ouvre un terminal **dans le dossier du projet** (`BebouParty`) et tape :
```
npm install
```
Ça télécharge tout ce dont l'app a besoin (ça peut prendre 1 à 2 minutes).

---

## 3. Lancer une partie 🎉

Tu vas ouvrir **deux fenêtres de terminal** dans le dossier `BebouParty`.

### 🪟 Terminal 1 — démarrer le serveur (sur ton PC)
```
npm run serveur
```
Tu dois voir s'afficher :
```
Serveur BebouParty démarré sur le port 8080
```
👉 **Laisse cette fenêtre ouverte** pendant toute la partie.

> ⚠️ La **première fois**, Windows peut afficher une fenêtre du pare-feu « Autoriser Node.js ? ». Coche **Réseaux privés** et clique **Autoriser l'accès** — sinon les téléphones ne pourront pas se connecter.

### 🔎 Trouver l'adresse IP de ton PC
Dans un terminal, tape :
```
ipconfig
```
Repère la ligne **« Adresse IPv4 »** dans la section de ta carte WiFi. Ce sera quelque chose comme :
```
192.168.1.10
```
Note cette adresse : c'est elle que les téléphones devront utiliser.

### 🪟 Terminal 2 — lancer l'application
```
npx expo start
```
Un **QR code** apparaît dans le terminal.

### 📱 Sur chaque téléphone
1. Ouvre **Expo Go** et **scanne le QR code** (sur iPhone tu peux aussi le scanner avec l'appareil photo).
2. L'app BebouParty s'ouvre. En bas de l'écran d'accueil, dans **« Adresse du PC-serveur »**, écris l'adresse trouvée plus haut **suivie de `:8080`** :
   ```
   192.168.1.10:8080
   ```
   (remplace par TON adresse). Tout le monde — y compris l'hôte — met la **même** adresse.
3. **Une personne** appuie sur **« Créer une salle »** → elle devient l'hôte et obtient un **code** (ex. `BEBOU-4829`).
4. **Les autres** appuient sur **« Rejoindre une salle »** et entrent ce code.
5. Quand il y a au moins 2 joueurs, l'hôte peut **« Lancer la partie »**, puis choisir le mini-jeu. Tout le monde suit automatiquement !

---

## 4. Dépannage 🛠️

| Problème | Solution |
|---|---|
| **« Connexion impossible »** sur un téléphone | Vérifie l'adresse (la bonne IP + `:8080`), et que le téléphone est sur le **même WiFi** que le PC. |
| Personne n'arrive à se connecter | Le **pare-feu Windows** bloque sûrement Node.js. Autorise-le (voir l'encadré ⚠️ ci-dessus), ou désactive temporairement le pare-feu sur le réseau privé. |
| Le QR code ne fonctionne pas | Assure-toi qu'Expo Go et le PC sont sur le même WiFi. Tu peux aussi taper l'URL affichée par `expo start` à la main dans Expo Go. |
| L'IP a changé | Les box attribuent parfois une nouvelle IP. Refais `ipconfig` et mets à jour l'adresse dans l'app. |
| « Cette salle n'existe pas » | Le code est mal tapé, ou l'hôte a fermé l'app. Recrée une salle. |

---

## 5. Pour les curieux : comment c'est rangé 🗂️

```
BebouParty/
├── App.js                  → point de départ de l'app
├── serveur/
│   ├── serveur.js          → le serveur à lancer sur le PC
│   └── salles.js           → la logique des salles (avec tests)
├── src/
│   ├── ecrans/             → les écrans (Accueil, Profil, Salle, etc.)
│   ├── composants/         → briques réutilisables (boutons, mascotte…)
│   ├── reseau/             → TOUTE la communication réseau (un seul endroit)
│   ├── theme/              → couleurs et styles
│   ├── donnees/            → les options de mascotte
│   └── etat/               → le profil du joueur (mémorisé sur le téléphone)
└── docs/                   → la conception et le plan détaillé du projet
```

Le code est **commenté en français** partout, n'hésite pas à fouiller. 😊

---

## 6. Tester / vérifier le code

Pour lancer les tests automatiques (logique des salles, réseau, mascotte) :
```
npm test
```

---

Fait avec 💜 — amuse-toi bien en soirée !
