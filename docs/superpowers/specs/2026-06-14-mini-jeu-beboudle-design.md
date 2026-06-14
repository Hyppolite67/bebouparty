# Mini-jeu « Beboudle » — Spécification de design

> Statut : **validé** (mockup `mockups/beboudle.html` validé par l'utilisateur le 2026-06-14).

## 1. Concept

Mini-jeu de devinette multijoueur local (même système réseau que « Dessine-moi »).
Une **manche** = une **personne** cachée représentée par **4 emojis** révélés un par un (toutes les 15 s). Les joueurs devinent de qui il s'agit parmi **6 prénoms** proposés. Deviner tôt (peu d'indices) = plus de points.

Une partie = plusieurs manches (cible 10, plafonnée au nombre de combos disponibles).
Chaque joueur répond **une seule fois** par manche, sur son propre téléphone.

## 2. Décisions verrouillées

| Sujet | Décision |
|---|---|
| Nom affiché / id technique | « Beboudle » / `beboudle` |
| Emojis | **Rendu natif** par téléphone (`<Text>`), pas de Twemoji. Voir mémoire `beboudle-emojis`. |
| Base de personnes | Stockée **en local sur l'hôte** (AsyncStorage). Envoyée au serveur dans `CHOISIR_JEU`. |
| Autorité | **Serveur** (comme Turbo/Dessin) : il tire les manches, révèle les indices via timers, calcule les points. |
| Réglages | Pas d'écran de réglages : la cible est 10 manches, plafonnée aux combos remplis. |
| Mode créateur | Écran admin séparé, **non réseau**, accès par bouton discret sur l'accueil + code `7285`. |

## 3. Barème de points (autorité serveur)

| Réponse au moment où… | Points |
|---|---|
| 1 emoji révélé | +500 |
| 2 emojis révélés | +300 |
| 3 emojis révélés | +150 |
| 4 emojis révélés | +50 |
| Mauvaise réponse | −100 |
| Personne ne trouve | 0 pour tous, on révèle et on enchaîne |

Un joueur peut tomber sur un combo qui le décrit lui-même — voulu.

## 4. Déroulé d'une manche (timing serveur)

- `t=0 s` : début de manche → diffusion des **6 choix** + révélation **indice 1**.
- `t=15 s` : indice 2. `t=30 s` : indice 3. `t=45 s` : indice 4.
- `t=60 s` : fin de manche (révélation de la bonne réponse + scores), **ou avant** si **tous ont répondu**.
- Pause de ~6 s (écran scores intermédiaire) → manche suivante, ou **podium final**.

Constantes : `INTERVALLE_INDICE = 15000 ms`, `GRACE_FIN = 15000 ms` (après le 4e indice), `PAUSE_SCORES = 6000 ms`.

## 5. Base de personnes (données)

Seed par défaut (modifiable via mode créateur), id stable par personne :

- **Lucas S** — combos : `🏃‍♂️👟😆🍺` · `🤫🎯🍺🤏` · `🙏👩🔞💘`
- **Lucas Tutin** — combo : `🤓🟢⚽️⚪️`
- **Alex, Simon C, Simon Kit, Simon Rousseau, Maxime, Wawan, Nathan, Charlélie, La Tang** — sans combo (servent de **distracteurs** dans les 6 boutons jusqu'à ce qu'on leur ajoute des combos).

Règles de tirage :
- Une **manche** = un couple (personne, combo) parmi tous les combos **remplis (4 emojis)**. On ne rejoue pas deux fois le **même combo** dans une partie.
- Les **6 boutons** = la bonne personne + **5 autres** prénoms tirés au hasard dans la base (combos vides inclus), distincts.
- Si **0 combo rempli** : le jeu ne peut pas démarrer → l'app prévient l'hôte (« Ajoute au moins un combo dans le mode créateur »).

## 6. Mode créateur (admin, hors réseau)

- Accès : bouton discret (icône ✏️) en bas de l'accueil → saisie code `7285` → `EcranCreateur`.
- **Vue liste** : chaque personne = carte dépliable montrant ses combos ; par combo : modifier / supprimer ; bouton « + Ajouter un combo » ; bouton « + Nouvelle personne ».
- **Édition d'un combo** : 4 champs emoji (clavier emoji natif), **aperçu** en direct, « Valider ».
- **Nouvelle personne** : champ prénom (+ option 1er combo).
- Persistance : **AsyncStorage** (clé `bebouparty.personnes`), disponible pour toutes les parties hébergées depuis ce téléphone. Seed initial = base par défaut si stockage vide.

## 7. Écran de jeu (réf. mockup `mockups/beboudle.html`)

- **Haut** : `MANCHE x/N` (doré espacé) + score perso 🏆.
- **4 cases emojis** : révélées (pop + flash + particules) ou « ? » qui pulse.
- **Timer** sous les cases : barre qui se vide entre indices (orange→rouge sur les 5 dernières s).
- **Feedback live** : toast « X a répondu ! » (sans dire si c'est juste), ~2 s.
- **6 boutons** (grille 2×3) : tap = sélection verrouillée (violet vif), 1 seule réponse/manche.
- **Révélation** : bonne réponse en **vert** (+points), ma sélection fausse en **rouge** ; puis **écran scores intermédiaire** (podium animé) avant la manche suivante.
- **Podium final** : réutilise `EcranPodium`.

## 8. Synchronisation réseau (mêmes mécanismes que Dessin/Turbo)

Messages **serveur → client** : `JEU_CHOISI`(idJeu=`beboudle`), `BEBOUDLE_MANCHE`, `REVELER_INDICE`, `A_REPONDU`, `BEBOUDLE_MANCHE_FINIE`, `BEBOUDLE_FINIE`.
Messages **client → serveur** : `CHOISIR_JEU`{idJeu, personnes, manches}, `REPONDRE`{personneId}.
Replay anti-course (comme `courseDemarre`) : `ClientReseau` mémorise la dernière manche + les indices déjà révélés et les rejoue aux écrans qui s'abonnent tard.

## 9. Intégration

- Carte « Beboudle » **déverrouillée** dans `EcranSelectionJeu` (icône ❓, fond rose/magenta, desc « T'as reconnu qui ? »).
- Nouveaux écrans dans `Navigation` : `Beboudle`, `Createur`.
- Même lobby / salle d'attente / retour hub que les autres jeux.

## 10. Hors périmètre v1

- Pas d'édition de la base en cours de partie ; pas de synchro de la base entre téléphones (locale à l'hôte).
- Pas de son (cohérent avec l'état actuel du projet).
