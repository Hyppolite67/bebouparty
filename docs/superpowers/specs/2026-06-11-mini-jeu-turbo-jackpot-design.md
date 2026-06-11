# Mini-jeu « Turbo Jackpot » — Spécification de conception

**Date :** 2026-06-11
**Statut :** Conception validée (visuel + technique), prête pour le plan
**Projet :** BebouParty (base + mini-jeu « Dessine-moi » déjà en ligne)

---

## 1. Objectif

Ajouter un 2ᵉ mini-jeu : une **course de karts** synchronisée où les karts n'avancent **que** grâce au **grattage de tickets**. Chaque joueur gratte des tickets le plus vite possible pendant **60 s** ; chaque ticket révèle **3 symboles** dont la **combinaison** déclenche un effet immédiat sur la course (avancer, faire reculer un adversaire, bouclier, malédiction…). À la fin : podium + points ajoutés au score global de la session.

Réutilise au maximum l'existant : système réseau (`ClientReseau`), serveur autoritaire (même approche que `partie.js`), lobby/salle d'attente, podium/scores, thème visuel.

**Référence visuelle validée :** `mockups/turbo-jackpot.html`.

---

## 2. Principe d'architecture (identique à « Dessine-moi »)

- **Serveur autoritaire** (`serveur/turbo.js`, logique pure testée TDD) : détient les **positions** des karts, applique les **effets**, gère le **timer** commun, calcule le **classement** et les **points**.
- **Grattage 100% local** : chaque joueur gratte sur son téléphone ; seul le **résultat d'un ticket terminé** (`{ symboles:[a,b,c] }`) est envoyé au serveur. Le grattage lui-même n'est pas synchronisé — uniquement ses effets.
- **Anti-triche (jeu entre amis)** : le client tire ses propres symboles selon les probabilités et envoie le ticket terminé ; le serveur applique l'effet de façon autoritaire. Suffisant pour un party game.

---

## 3. Symboles et fréquences (tirage par case, côté client)

| Symbole | Emoji | Probabilité |
|---|---|---|
| Fusée | 🚀 | 20 % |
| Étoile | ⭐ | 20 % |
| Bombe | 💣 | 18 % |
| Escargot | 🐌 | 18 % |
| Bouclier | 🛡️ | 12 % |
| Joker | 🃏 | 12 % |

Chaque case d'un ticket est tirée indépendamment selon ces probas.

---

## 4. Table des combos et effets (calculée par le serveur)

La combinaison des 3 symboles (ordre indifférent) détermine l'effet. On évalue du plus spécifique (3 identiques, combos nommés) au plus général (2 identiques + autre).

**Très fréquents**
- 🚀🚀 + autre → **BOOST** : +1 case
- ⭐⭐ + autre → **ÉCLAT** : +1 case

**Fréquents**
- 🚀🚀⭐ → **TURBO** : +2 cases
- 💣💣 + autre → **PÉTARD** : le joueur **devant toi** recule de 1 case
- 🐌🐌 + autre → **GADOUE** : tu recules de 1 case

**Rares**
- 🚀🚀🚀 → **TURBO MAX** : +3 cases
- 💣💣💣 → **TRIPLE BOMBE** : tous les adversaires reculent de 1 case
- 🐌🐌🐌 → **MALÉDICTION** : tes prochains tickets valent **−1 case** pendant **10 s** (une seule malédiction active à la fois, non cumulable)
- 🛡️🛡️🛡️ → **BOUCLIER TOTAL** : immunisé contre le prochain effet négatif reçu
- ⭐⭐⭐ → **CONSTELLATION** : +2 cases **et** tu voles 1 case au joueur devant toi

**Très rares**
- 🚀⭐🃏 → **JACKPOT** : +4 cases **et** le leader recule de 2 cases
- 💣💣🃏 → **CHAOS TOTAL** : tous les adversaires reculent de 2 cases
- 🃏🃏🃏 → **TRIPLE JOKER** : tu échanges ta position avec le leader

**Aucun combo reconnu** → effet neutre léger (ex. +0, ou petit message). (À préciser à l'implémentation : par défaut, **+0 case**, message « Pas de combo… ».)

### Règles d'équilibre (impératives)
- Un effet ne peut **jamais faire reculer de plus de 3 cases** d'un coup.
- Position **minimale = 0** (jamais en dessous).
- Piste de **20 cases** au total ; atteindre 20 = franchir la ligne.
- Le **bouclier** dure jusqu'au **prochain effet négatif reçu** (il l'annule puis disparaît).
- Si le **Joker** est utilisé et que **tu es déjà le leader**, il devient **+2 cases** au lieu de son effet.
- La **malédiction (🐌🐌🐌)** ne se cumule pas (une seule active à la fois), durée 10 s.

---

## 5. Déroulé d'une partie (machine à états serveur)

1. L'hôte sélectionne **Turbo Jackpot** → le serveur crée une partie `turbo` pour la salle (positions à 0, scores à 0, timer 60 s) et diffuse `JEU_CHOISI { idJeu:'turbo' }` → tous naviguent vers l'écran du jeu. Le timer démarre.
2. Pendant 60 s : chaque client gratte. À chaque **ticket terminé**, le client envoie `TICKET_TERMINE { symboles }`.
3. Le serveur calcule le combo + applique l'effet (avec règles d'équilibre), met à jour les positions, et diffuse `ETAT_COURSE { positions, effets }` + `FEED { message, type }`.
4. **Fin** quand le timer atteint 0 **ou** qu'un kart atteint la case 20 → le serveur fige tout et diffuse `COURSE_FINIE { classement }`.
5. Points : **1er 500, 2ᵉ 300, 3ᵉ 150, 4ᵉ+ 50**, ajoutés au score global de session.

> Le **timer** est géré par le serveur (autorité), comme le chrono de « Dessine-moi » ; l'app affiche un compte à rebours local synchronisé au départ.

---

## 6. Protocole réseau (nouveaux messages, via `ClientReseau`)

**App → Serveur**
- `TICKET_TERMINE { symboles: [a, b, c] }`

**Serveur → App**
- `COURSE_DEMARRE { duree, positions, joueurs }` (au lancement)
- `ETAT_COURSE { positions, effets: [{ joueurId, type }] }` (à chaque effet ; `type` ∈ boost/recule/bouclier/ralenti/echange/jackpot/chaos…)
- `FEED { message, ton }` (`ton` ∈ vert/rouge/violet/dore — pour le fil en direct)
- `COURSE_FINIE { classement: [{ id, pseudo, points }] }`

Tous traduits en événements clairs dans `ClientReseau` (`courseDemarre`, `etatCourse`, `feed`, `courseFinie`).

---

## 7. Écran de jeu (layout validé)

Deux zones (cf. `mockups/turbo-jackpot.html`) :

**Zone haute (~40 %) — Piste**
- Fond violet très foncé, coins arrondis, **ligne d'arrivée à damier** à droite.
- Une **lane par joueur** : avatar (mascotte) + pseudo au-dessus du kart ; les karts **pointent vers la droite** et se déplacent fluidement (transition) à chaque `ETAT_COURSE`.
- **Effets visuels** sur le kart concerné : boost (flash/traînée dorée), recul (tremblement + flash rouge), bouclier (aura violette pulsante), ralenti (teinte bleue + 🐌 flottant), échange (tourbillon rose), jackpot (étoiles dorées), chaos (écran qui tremble).
- **Barre de timer** en haut (dégradé violet→cyan), 60 s, clignote en rouge sous 10 s.

**Zone basse (~60 %) — Ticket à gratter**
- Ticket « ⚡ TURBO JACKPOT », n° de ticket, texture en points, bordure dorée.
- **Fil d'actus « EN DIRECT »** sur **une ligne** sous l'en-tête (dernier événement, coloré selon le ton, s'efface/défile).
- **3 cases à gratter** (surface argentée à reflet) : grattage au doigt, révélation auto à **70 %** (pop + confetti), label du symbole dessous.
- **Bannière de combo** (slide-up, ~1,5 s) : couleur selon l'effet (vert bonus / rouge attaque / bleu malus / doré jackpot), nom du combo en grand espacé + description + icône ; puis **nouveau ticket automatique** (flux continu, sans bouton).

---

## 8. Mécanique de grattage (technique)

- Un **canvas de grattage par case** : une couche « argent » qu'on **efface au doigt** (PanResponder + react-native-svg, en réutilisant les leçons du dessin : `runOnJS`/PanResponder fiables, coords locales).
- Suivi du **pourcentage gratté** ; à **≥ 70 %**, on révèle le symbole (déjà tiré au début du ticket) avec animation pop + particules.
- Quand les **3 sont révélées** : on calcule le combo (affichage immédiat de la bannière côté client à partir de la même table que le serveur), on envoie `TICKET_TERMINE`, puis on enchaîne un nouveau ticket.

---

## 9. Écrans & fichiers (côté app)

**Réutilise** : `FondDegrade`, `CarteGlass`, `BoutonPrincipal`, `Mascotte`, thème, `ClientReseau`, `ChronoBar`, `EcranPodium`, le lobby/salle d'attente.

**Nouveaux**
| Fichier | Rôle |
|---|---|
| `src/ecrans/EcranTurboJackpot.js` | Orchestrateur du jeu (abonnements + composition) |
| `src/composants/turbo/Piste.js` | Lanes, karts, ligne d'arrivée, effets |
| `src/composants/turbo/TicketGratter.js` | Les 3 cases + grattage + révélation |
| `src/composants/turbo/CaseGratter.js` | Une case grattable (canvas) |
| `src/composants/turbo/BanniereCombo.js` | Bannière de résultat de combo |
| `src/composants/turbo/FilDirect.js` | Le fil « EN DIRECT » (1 ligne) |
| `src/donnees/symboles.js` | Symboles + probas + table des combos (partagée affichage) |
| `serveur/turbo.js` | Moteur de jeu autoritaire (logique pure, TDD) |
| `serveur/__tests__/turbo.test.js` | Tests TDD |

**Modifiés**
- `serveur/serveur.js` : gérer **plusieurs mini-jeux** (selon `idJeu`, instancier `Partie` *ou* `Turbo`, router les messages).
- `src/reseau/ClientReseau.js` : envois + événements Turbo.
- `src/ecrans/EcranSelectionJeu.js` : **débloquer la carte** « Turbo Jackpot » (icône kart, « Gratte et fonce ! ») ; au tap → lancer directement (pas d'écran de réglages).
- `src/navigation/Navigation.js` : déclarer `TurboJackpot`.
- Côté app, naviguer vers `JeuDessin` **ou** `TurboJackpot` selon `idJeu` reçu dans `jeuChoisi` (écrans hôte ET joueur).

> **Refactor serveur multi-jeux** : aujourd'hui `CHOISIR_JEU` crée toujours une partie « Dessine-moi ». On le rend générique : un registre `{ dessin: Partie, turbo: Turbo }`, et les handlers de messages routent vers le moteur de la salle.

---

## 10. Animations & effets (cf. cahier des charges)

Boost (flash/traînée dorée), recul (tremblement + flash rouge + fumée), bouclier (aura violette pulsante), ralenti (teinte bleue + 🐌), échange (tourbillon rose + clignotement), jackpot (étoiles dorées sur la piste), chaos (léger tremblement d'écran), ligne franchie (feux d'artifice), grattage (particules argentées), révélation (pop + confettis), bannière (pulse + couleur), nouveau ticket (slide rapide), timer < 10 s (clignote rouge). Reanimated + animations natives.

---

## 11. Fin de partie & scores

- Course stoppée pour tous simultanément (timer 0 ou case 20 atteinte).
- **Podium animé** (réutilise `EcranPodium`) : 1er/2e/3e…, célébration du 1er (confettis).
- Points : 500 / 300 / 150 / 50, **ajoutés au score global de la session**.
- Boutons « Rejouer » et « Changer de jeu » (ce dernier réservé à l'hôte). *(Le « score global de session » suppose un cumul entre mini-jeux — voir §13.)*

---

## 12. Tests

TDD sur `serveur/turbo.js` : tirage selon probas (distribution), mapping symboles→combo (tous les combos + cas « aucun »), application des effets, **règles d'équilibre** (recul ≤ 3, min 0, bouclier, joker-leader→+2, malédiction unique/10 s), détection de fin (timer / case 20), classement + points. Le visuel/grattage se vérifie sur téléphone.

---

## 13. Périmètre v1 (YAGNI / à confirmer à l'implémentation)

- **Score global de session** : si un cumul inter-jeux n'existe pas encore, on l'introduit simplement (somme des points par joueur sur la session) — sinon on l'ajoute. À cadrer dans le plan.
- Combo non reconnu → **+0 case** + message neutre.
- Son de grattage : **optionnel** (si simple à ajouter via expo-av ; sinon reporté).
- Pas de reconnexion en pleine course (cohérent avec « Dessine-moi »).

---

## 14. Critères de réussite

1. L'hôte lance Turbo Jackpot → tous arrivent sur l'écran de course.
2. Gratter un ticket révèle 3 symboles ; un combo applique le bon effet **synchronisé sur tous les téléphones** (positions identiques).
3. Les **effets visuels** et le **fil en direct** s'affichent à réception.
4. La course s'arrête pour tous (timer / case 20) → **podium + points**.
5. Les **règles d'équilibre** sont respectées (couvertes par tests).
6. Le réseau reste centralisé dans `ClientReseau` ; le serveur gère **proprement plusieurs mini-jeux**.
