// serveur/serveur.js
// Serveur WebSocket de BebouParty.
// - En local : node serveur/serveur.js  (écoute le port 8080)
// - En ligne (Render, Railway...) : l'hébergeur impose le port via process.env.PORT
const http = require('http');
const { WebSocketServer } = require('ws');
const { GestionnaireSalles } = require('./salles');

// L'hébergeur cloud fournit le port à utiliser ; sinon on prend 8080 en local.
const PORT = process.env.PORT || 8080;

// Petit serveur HTTP : il sert une page "santé" (pour que l'hébergeur voie que
// le service répond) ET il porte le serveur WebSocket sur le même port.
const serveurHttp = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('BebouParty serveur OK');
});

// On attache le WebSocket au serveur HTTP (au lieu d'ouvrir un port à part).
const wss = new WebSocketServer({ server: serveurHttp });
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

// On écoute sur 0.0.0.0 pour accepter les connexions extérieures (téléphones / cloud).
serveurHttp.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur BebouParty démarré sur le port ${PORT}`);
});
