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
      if (!r.ok) { envoyer(ws, 'ERREUR', { code: r.code, message: 'Cette salle n\'existe pas' }); return; }
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
    if (r && r.ferme) diffuser(r.code, 'ERREUR', { code: 'SALLE_FERMEE', message: 'L\'hôte a quitté la partie' });
  });
});

console.log(`Serveur BebouParty démarré sur le port ${PORT}`);
