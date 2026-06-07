# Mini-jeu « Devine le dessin » — Spécification de conception

**Date :** 2026-06-07
**Statut :** Validé en brainstorming, en attente de relecture utilisateur
**Projet :** BebouParty (la base v1 est déjà construite, en ligne sur Render)

---

## 1. Objectif

Ajouter le **gameplay principal** de BebouParty : un mini-jeu de dessin/devinettes **en temps réel, style skribbl.io**. Un joueur dessine un mot secret ; les autres voient le dessin se former en direct et devinent dans un chat. On tourne, on marque des points, on affiche un podium.

C'est une **suite de la base existante** : on réutilise le serveur WebSocket (déployé sur Render), le module réseau découplé `ClientReseau`, les salles, les mascottes et le thème visuel.

---

## 2. Décisions validées (brainstorming)

| Sujet | Décision |
|---|---|
| Mécanique | **Style skribbl** : un dessine en direct, les autres devinent dans un chat |
| Outils de dessin | **Complet** : palette (~16 couleurs), 3 tailles, gomme, **fond** (= « pot de peinture » = couleur de fond), **annuler**, **tout effacer** |
| Durée | **Réglée par l'hôte** avant la partie : nombre de manches (1–3) + temps par dessin (60/80/100 s) |
| Choix du mot | Le dessinateur **choisit parmi 3 mots** proposés (sinon choix auto à la fin d'un petit compte à rebours) |
| Synchro du dessin | **Flux de points en direct** (approche A), throttlé ~50 ms, relayé par le serveur |
| Autorité | **Le serveur fait foi** (machine à états par salle) ; les téléphones affichent et envoient les actions |
| Mise en page | Validée via maquettes (`.superpowers/brainstorm/759-1780851253/jeu-layout-v3.html`) |

---

## 3. Déroulé d'une partie (machine à états — côté serveur)

Module `serveur/partie.js` (logique pure, testée en TDD), piloté par `serveur.js`.

1. **Démarrage** : à `CHOISIR_JEU` (idJeu = `dessin`) avec les réglages de l'hôte, le serveur crée l'état de partie de la salle : ordre des joueurs (= ordre d'arrivée), manche = 1, scores à 0.
2. **Début d'un tour** : le serveur désigne le dessinateur courant, tire **3 mots** au hasard, les lui envoie (`CHOIX_MOTS`). Un compte à rebours court (ex. 15 s) ; s'il ne choisit pas, le serveur choisit pour lui.
3. **Dessin** : le serveur diffuse `TOUR_DEMARRE { dessinateurId, nbLettres, duree }` et lance le **chrono** (autoritaire). Tout le monde sauf le dessinateur est « devineur ».
4. **Pendant le tour** : relais des traits (§5) et traitement des devinettes (§6).
5. **Fin de tour** quand : tous les devineurs ont trouvé **OU** le chrono atteint 0 **OU** le dessinateur quitte. Le serveur diffuse `TOUR_FINI { mot, pointsDuTour }` (révélation).
6. **Tour suivant** : dessinateur suivant. Quand tous ont dessiné une fois → manche suivante. Après la dernière manche → `PARTIE_FINIE { classement }`.

---

## 4. Score

Formule simple et lisible (calculée par le serveur) :
- **Devineur** qui trouve : points proportionnels au **temps restant** (ex. `base + round(tempsRestant / tempsTotal × bonus)`), donc plus on trouve tôt, plus on gagne. Ordre d'arrivée pris en compte (le 1ᵉʳ peut avoir un petit bonus).
- **Dessinateur** : gagne des points **à chaque devineur correct** (récompense un bon dessin), plafonné.
- Valeurs exactes (base/bonus) fixées dans `partie.js` et faciles à ajuster ; couvertes par les tests.

---

## 5. Synchronisation du dessin (approche A)

Messages WebSocket, **émis uniquement par le dessinateur courant** (le serveur rejette les autres), relayés à toute la salle :

| Message | Contenu | Effet |
|---|---|---|
| `TRAIT_DEBUT` | `{ id, couleur, taille }` | Commence un nouveau trait |
| `TRAIT_POINTS` | `{ id, points: [[x,y],…] }` | Ajoute des points au trait courant (envoyé ~toutes les 50 ms) |
| `TRAIT_FIN` | `{ id }` | Termine le trait |
| `ANNULER` | `{}` | Retire le dernier trait |
| `EFFACER_TOUT` | `{}` | Vide le dessin |
| `FOND` | `{ couleur }` | Change la couleur de fond |

- Coordonnées **normalisées** (0–1) pour s'adapter à toutes les tailles d'écran.
- Le **dessinateur fait foi** : pas de stockage long terme côté serveur (un joueur qui se reconnecte en plein tour peut rater des traits — accepté en v1).
- Rendu côté app : chaque trait = un `Path` react-native-svg ; seul le trait en cours se redessine pendant le mouvement.

---

## 6. Devinettes

- Un devineur envoie `DEVINER { texte }`.
- Le serveur **normalise** (minuscule, sans accents, espaces réduits) le texte ET le mot, puis compare :
  - **Exact** → le joueur a trouvé : score (§4), diffusion `A_TROUVE { joueurId, pseudo }` **sans révéler le mot**. Le dessinateur gagne aussi ses points.
  - **Tout proche** (distance de 1 caractère) → diffusion `PRESQUE { pseudo }` (« X est tout proche ! »), visible seulement par l'auteur (ou par tous, à décider à l'implémentation ; défaut : seulement l'auteur pour ne pas aider les autres).
  - **Faux** → diffusion `MESSAGE_CHAT { pseudo, texte }` à tous (chat normal).
- Le **dessinateur ne peut pas deviner**. Un joueur qui a déjà trouvé ne renvoie plus de devinettes (ses messages passent en chat normal pour les autres « trouveurs »).

---

## 7. Réglages de l'hôte

Avant le lancement, l'hôte voit `ReglagesPartie` :
- **Nombre de manches** : 1 / 2 / 3 (défaut 2)
- **Temps par dessin** : 60 / 80 / 100 s (défaut 80)
- Bouton « Lancer ». Les réglages partent au serveur avec `CHOISIR_JEU`.

---

## 8. Les mots

- Liste française intégrée `src/donnees/mots.js` (≈ 150–200 mots : objets, animaux, nourriture, actions, lieux…).
- Le serveur tire **3 mots distincts** au hasard par tour (en évitant de répéter ceux déjà sortis dans la partie tant que possible).
- Facile à enrichir / catégoriser plus tard.

---

## 9. Écrans & composants (côté app)

**Réutilise** : `FondDegrade`, `CarteGlass`, `BoutonPrincipal`, `Mascotte`, le thème, `ClientReseau`, le contexte joueur.

**Nouveaux / modifiés :**
| Fichier | Rôle |
|---|---|
| `src/ecrans/ReglagesPartie.js` | Écran hôte : manches + temps (avant lancement) |
| `src/ecrans/EcranJeuDessin.js` | **Remplace le placeholder** ; orchestre les rôles (dessinateur/devineur) + sur-écrans |
| `src/composants/jeu/Canvas.js` | Zone de dessin : capture tactile (dessinateur) + rendu des traits (tous) |
| `src/composants/jeu/BarreOutils.js` | Palette, tailles, gomme, fond, annuler, effacer |
| `src/composants/jeu/ChatDevinettes.js` | Liste des messages + champ de saisie (devineur) |
| `src/composants/jeu/TableauScores.js` | Bande des joueurs + scores + état (✓ trouvé / ✏️ dessine) |
| `src/composants/jeu/ChronoBar.js` | Barre + compte à rebours (affichage local, fin décidée par le serveur) |
| `src/composants/jeu/ChoixMot.js` | Sur-écran : 3 mots à choisir (dessinateur) |
| `src/composants/jeu/RevelationTour.js` | Sur-écran fin de tour : mot + points |
| `src/ecrans/EcranPodium.js` | Classement final 🏆 |
| `src/reseau/ClientReseau.js` | **Étendu** : nouvelles fonctions d'envoi + événements du jeu |
| `serveur/partie.js` | **Logique pure** de la partie (TDD) |
| `serveur/serveur.js` | **Étendu** : câble `partie.js`, relaie le dessin, gère le chrono |
| `src/donnees/mots.js` | Liste de mots française |
| `src/jeu/normaliser.js` | Normalisation d'une réponse (pure, testée) — partagée |

> Le **chrono** est géré par le serveur (autorité) ; l'app affiche un compte à rebours local synchronisé au début du tour, mais c'est le serveur qui envoie `TOUR_FINI`.

---

## 10. Protocole réseau (récapitulatif des nouveaux messages)

**App → Serveur :** `CHOISIR_JEU {idJeu, reglages}`, `CHOISIR_MOT {mot}`, `TRAIT_DEBUT`, `TRAIT_POINTS`, `TRAIT_FIN`, `ANNULER`, `EFFACER_TOUT`, `FOND`, `DEVINER {texte}`.

**Serveur → App :** `CHOIX_MOTS {mots[3]}`, `TOUR_DEMARRE {dessinateurId, nbLettres, duree}`, (relais dessin), `A_TROUVE {joueurId, pseudo}`, `PRESQUE {pseudo}`, `MESSAGE_CHAT {pseudo, texte}`, `SCORES {joueurs[]}`, `TOUR_FINI {mot, pointsDuTour}`, `PARTIE_FINIE {classement}`.

Tous passent par `ClientReseau` (les écrans ne touchent jamais le WebSocket directement).

---

## 11. Gestion d'erreurs

- **Dessinateur quitte/déconnecte en plein tour** → le serveur termine le tour (mot révélé, dessinateur 0 point) et enchaîne.
- **Devineur quitte** → retiré, la partie continue ; recalcul de « tout le monde a trouvé ».
- **Hôte quitte** → la salle se ferme (comportement existant), retour accueil pour les autres.
- **Tous ont trouvé avant le chrono** → fin de tour immédiate.
- **Coupure réseau** → bandeau d'erreur existant (`deconnecte`).

---

## 12. Tests

- **TDD côté serveur (`partie.js`)** : ordre des tours, passage de manche, calcul du score, détection « exact / tout proche / faux », fin de tour (tous trouvés / dessinateur parti), fin de partie + classement.
- **`normaliser.js`** (pur) : minuscule, accents, espaces, casse.
- **`mots.js`** : tirage de 3 mots distincts.
- Le dessin, le rendu et l'animation se vérifient **manuellement sur téléphone** (comme la base).

---

## 13. Périmètre v1 (YAGNI — volontairement exclu)

- Pas d'indices révélant des lettres au fil du temps (juste le **nombre de lettres**).
- « Pot de peinture » = **remplissage du fond** uniquement (pas de flood-fill de zone).
- Pas de reconnexion en plein tour (le retardataire reprend au tour suivant).
- Pas de catégories/thèmes de mots (liste unique mélangée).
- Pas de chat libre hors devinettes, pas d'emojis/réactions.

Tout cela pourra être ajouté plus tard sans remettre en cause l'architecture.

---

## 14. Critères de réussite

1. L'hôte règle (manches + temps), lance, et **tous** arrivent dans le jeu.
2. Le dessinateur choisit un mot ; les autres voient le **dessin se former en direct**.
3. Une bonne réponse marque des points (rapidité), **sans révéler le mot** aux autres ; le dessinateur marque aussi.
4. Le tour se termine au bon moment (tous trouvés / chrono / dessinateur parti) avec **révélation du mot**.
5. Après la dernière manche, un **podium** s'affiche pour tous.
6. La logique de partie est couverte par des **tests automatisés**.
7. Le réseau reste **centralisé dans `ClientReseau`** ; l'architecture découplée est préservée.
