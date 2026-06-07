# 🚀 Mettre le serveur BebouParty en ligne (gratuit, avec Render)

Objectif : héberger le serveur WebSocket sur internet pour que **n'importe quel téléphone**
puisse se connecter (plus besoin d'être sur le même WiFi). C'est **gratuit**.

Tu n'as à faire ça **qu'une seule fois**. Ensuite, le serveur reste en ligne.

---

## Étape 1 — Mettre le code sur GitHub

GitHub, c'est l'endroit où vit ton code en ligne. Render ira le chercher là.

1. Crée un compte gratuit sur **https://github.com** (si tu n'en as pas).
2. Clique sur le **+** en haut à droite → **New repository**.
3. Nom : `bebouparty` (laisse le reste par défaut, **ne coche PAS** « Add a README »).
4. Clique **Create repository**.
5. GitHub affiche une page avec une adresse du type :
   `https://github.com/TON-PSEUDO/bebouparty.git`
   👉 **Copie cette adresse et donne-la moi** : je m'occupe d'envoyer le code dessus.

   (Au premier envoi, une fenêtre te demandera peut-être de te connecter à GitHub
   dans ton navigateur — accepte, c'est normal.)

---

## Étape 2 — Créer le service sur Render

1. Crée un compte gratuit sur **https://render.com** (tu peux te connecter avec GitHub,
   c'est le plus simple).
2. Dans le tableau de bord : **New +** → **Web Service**.
3. Choisis **Build and deploy from a Git repository** → connecte ton GitHub →
   sélectionne le dépôt `bebouparty`.
4. Remplis les réglages **exactement** comme ceci :

   | Réglage | Valeur |
   |---|---|
   | **Name** | `bebouparty` (ou ce que tu veux) |
   | **Root Directory** | `serveur` |
   | **Runtime / Language** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

5. Clique **Create Web Service**. Render installe et démarre (~2-3 min).
   Quand c'est prêt, tu verras « **Live** » et une adresse du type :
   `https://bebouparty.onrender.com`

---

## Étape 3 — Brancher l'application

1. Ouvre BebouParty sur ton téléphone.
2. Dans le champ **« Adresse du PC-serveur »** de l'accueil, mets **juste le domaine** :
   `bebouparty.onrender.com`  (sans `https://`, sans `:8080`)
   L'app se connectera automatiquement en sécurisé (`wss://`).
3. Crée une salle → ça doit marcher, même en 4G ou sur un autre WiFi ! 🎉

---

## Bon à savoir (offre gratuite)

- Sur l'offre **Free**, le serveur **s'endort** après ~15 min sans activité.
  La **première connexion** après une pause peut prendre **~30 secondes** (réveil) :
  c'est normal, réessaie une fois si besoin.
- Le serveur **ne garde rien en mémoire** entre deux redémarrages (une partie = une session),
  ce qui est exactement le comportement voulu.
- Pour mettre à jour le serveur plus tard : on renvoie le code sur GitHub, Render
  redéploie tout seul.
