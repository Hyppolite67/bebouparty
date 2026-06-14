// serveur/serveur.js
// Serveur WebSocket de BebouParty.
// - En local : node serveur/serveur.js  (écoute le port 8080)
// - En ligne (Render, Railway...) : l'hébergeur impose le port via process.env.PORT
const http = require('http');
const { WebSocketServer } = require('ws');
const { GestionnaireSalles } = require('./salles');
const { Partie } = require('./partie');
const { CourseTurbo } = require('./turbo');
const { Beboudle } = require('./beboudle');

// Constantes de timing du mini-jeu « Beboudle »
const BEBOUDLE_INTERVALLE = 15000; // ms entre chaque indice
const BEBOUDLE_GRACE = 15000;      // ms après le 4e indice avant clôture
const BEBOUDLE_PAUSE = 6000;       // ms d'écran scores entre manches

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

// Table des parties en cours : code -> { partie, minuteur, debut, duree }
const parties = {};

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

// Retrouve le ws d'un joueur par son idSocket et lui envoie un message
function envoyerA(idSocket, type, donnees = {}) {
  for (const ws of wss.clients) {
    if (ws.idSocket === idSocket) { envoyer(ws, type, donnees); return; }
  }
}

// Relaie un message de dessin à tous les joueurs de la salle SAUF l'émetteur
function relayerAuxAutres(wsEmetteur, code, type, donnees = {}) {
  for (const ws of wss.clients) {
    if (ws.codeSalle === code && ws !== wsEmetteur) envoyer(ws, type, donnees);
  }
}

// Temps restant dans le tour en cours (en secondes)
function tempsRestant(code) {
  const slot = parties[code];
  if (!slot || !slot.debut) return 0;
  return Math.max(0, slot.duree - (Date.now() - slot.debut) / 1000);
}

// Retrouve le pseudo d'un joueur par son idSocket dans la salle
function pseudoDe(code, idSocket) {
  const joueurs = gestion.listeJoueurs(code);
  const joueur = joueurs.find((j) => j.id === idSocket);
  return joueur ? joueur.pseudo : '?';
}

// ── Gestion du déroulement de la partie ──────────────────────────────────────

// Démarre le tour suivant et annonce les rôles
function demarrerTourEtAnnoncer(code) {
  const slot = parties[code];
  if (!slot) return;
  const tour = slot.partie.demarrerTour();
  if (!tour) { return finirPartie(code); } // plus de manche → podium
  // Envoyer les 3 mots AU dessinateur uniquement
  envoyerA(tour.dessinateurId, 'CHOIX_MOTS', { mots: tour.mots });
  // Prévenir tout le monde qui va dessiner (sans révéler le mot)
  diffuser(code, 'PREPARATION', { dessinateurId: tour.dessinateurId });
}

// Termine le tour en cours (timeout ou tous ont trouvé ou dessinateur parti)
function finirTour(code) {
  const slot = parties[code];
  if (!slot) return;
  clearTimeout(slot.minuteur);
  slot.minuteur = null;
  const { mot, scores } = slot.partie.finTour();
  diffuser(code, 'TOUR_FINI', { mot, scores });
  // Petite pause de révélation, puis tour suivant (ou podium si partie finie)
  if (slot.partie.estFinie()) {
    slot.minuteur = setTimeout(() => finirPartie(code), 5000);
  } else {
    slot.minuteur = setTimeout(() => demarrerTourEtAnnoncer(code), 5000);
  }
}

// Termine la partie et diffuse le podium
function finirPartie(code) {
  const slot = parties[code];
  if (!slot) return;
  clearTimeout(slot.minuteur);
  diffuser(code, 'PARTIE_FINIE', { classement: slot.partie.classement() });
  delete parties[code];
}

// ── Gestion du déroulement de la course Turbo Jackpot ───────────────────────

// Démarre la course : timestamp de départ, diffuse l'état initial, arme le timer de fin
function demarrerCourse(code) {
  const slot = parties[code];
  if (!slot) return;
  slot.debut = Date.now();
  diffuser(code, 'COURSE_DEMARRE', {
    duree: slot.jeu.duree,
    positions: slot.jeu.positions(),
    joueurs: gestion.listeJoueurs(code),
  });
  // Fin automatique quand la durée est écoulée
  slot.minuteur = setTimeout(() => finirCourse(code), slot.jeu.duree * 1000);
}

// Termine la course : arrête le timer, diffuse le classement, nettoie le slot
function finirCourse(code) {
  const slot = parties[code];
  if (!slot) return;
  clearTimeout(slot.minuteur);
  diffuser(code, 'COURSE_FINIE', { classement: slot.jeu.classement() });
  delete parties[code];
}

// ── Gestion du déroulement de Beboudle ──────────────────────────────────────

// Démarre la manche suivante : diffuse les choix, révèle l'indice 1, arme les timers.
function demarrerMancheBeboudle(code) {
  const slot = parties[code];
  if (!slot || slot.idJeu !== 'beboudle') return;
  const m = slot.jeu.demarrerManche();
  if (!m) return finirBeboudle(code);

  diffuser(code, 'BEBOUDLE_MANCHE', { manche: m.manche, total: m.total, choix: m.choix });
  // Indice 1 tout de suite
  diffuser(code, 'REVELER_INDICE', { indice: 1, emoji: slot.jeu.emoji(0) });

  // Indices 2,3,4 toutes les 15 s, puis clôture après un délai de grâce.
  slot.timers = [];
  for (let k = 2; k <= 4; k++) {
    slot.timers.push(setTimeout(() => {
      const r = slot.jeu.revelerProchain();
      if (r) diffuser(code, 'REVELER_INDICE', r);
    }, BEBOUDLE_INTERVALLE * (k - 1)));
  }
  slot.timers.push(setTimeout(() => finirMancheBeboudle(code),
    BEBOUDLE_INTERVALLE * 3 + BEBOUDLE_GRACE));
}

function nettoyerTimersBeboudle(slot) {
  (slot.timers || []).forEach(clearTimeout);
  slot.timers = [];
}

// Clôture la manche : révèle la bonne réponse + scores, puis enchaîne (ou podium).
function finirMancheBeboudle(code) {
  const slot = parties[code];
  if (!slot || slot.idJeu !== 'beboudle' || slot.mancheClose) return;
  slot.mancheClose = true;
  nettoyerTimersBeboudle(slot);
  const res = slot.jeu.finirManche();
  diffuser(code, 'BEBOUDLE_MANCHE_FINIE', res);
  setTimeout(() => {
    if (!parties[code]) return;
    slot.mancheClose = false;
    demarrerMancheBeboudle(code); // demarrerManche renverra null à la fin → finirBeboudle
  }, BEBOUDLE_PAUSE);
}

function finirBeboudle(code) {
  const slot = parties[code];
  if (!slot) return;
  nettoyerTimersBeboudle(slot);
  diffuser(code, 'BEBOUDLE_FINIE', { classement: slot.jeu.classement() });
  delete parties[code];
}

// ── Gestion des connexions WebSocket ─────────────────────────────────────────

wss.on('connection', (ws) => {
  ws.idSocket = 'S' + prochainId++;
  console.log('Connexion', ws.idSocket);
  // On informe tout de suite le client de son propre identifiant.
  envoyer(ws, 'MON_ID', { id: ws.idSocket });

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    const code = ws.codeSalle;

    if (msg.type === 'CREER_SALLE') {
      const { code: nouveauCode } = gestion.creerSalle(ws.idSocket, msg.profil);
      ws.codeSalle = nouveauCode;
      envoyer(ws, 'SALLE_CREEE', { code: nouveauCode });
      diffuserListe(nouveauCode);
    }

    else if (msg.type === 'REJOINDRE_SALLE') {
      const r = gestion.rejoindreSalle(ws.idSocket, msg.code, msg.profil);
      if (!r.ok) { envoyer(ws, 'ERREUR', { code: r.code, message: 'Cette salle n\'existe pas' }); return; }
      ws.codeSalle = r.codeSalle;
      diffuserListe(r.codeSalle);
    }

    else if (msg.type === 'LANCER_PARTIE') {
      if (gestion.estHote(ws.idSocket)) diffuser(code, 'PARTIE_LANCEE');
    }

    // L'hôte choisit le jeu et ses réglages → créer la partie, naviguer, puis démarrer le jeu
    else if (msg.type === 'CHOISIR_JEU') {
      if (!gestion.estHote(ws.idSocket)) return;
      const joueurs = gestion.listeJoueurs(code);

      if (msg.idJeu === 'beboudle') {
        // ── Beboudle ──
        const personnes = msg.personnes || [];
        const jeu = new Beboudle(joueurs, { personnes, manches: msg.manches || 10 });
        parties[code] = { idJeu: 'beboudle', jeu, timers: [], mancheClose: false };
        diffuser(code, 'JEU_CHOISI', { idJeu: 'beboudle' });
        demarrerMancheBeboudle(code);
      } else if (msg.idJeu === 'turbo') {
        // ── Course Turbo Jackpot ──
        const jeu = new CourseTurbo(joueurs, { duree: 60 });
        parties[code] = {
          idJeu: 'turbo',
          jeu,
          debut: null,
          duree: 60,
          minuteur: null,
        };
        diffuser(code, 'JEU_CHOISI', { idJeu: 'turbo' });
        demarrerCourse(code);
      } else {
        // ── Dessine-moi (comportement original inchangé) ──
        const reglages = msg.reglages || { manches: 2, duree: 80 };
        parties[code] = {
          idJeu: 'dessin',
          partie: new Partie(joueurs, reglages),
          minuteur: null,
          debut: null,
          duree: reglages.duree,
        };
        // Faire naviguer toute la salle vers l'écran de jeu
        diffuser(code, 'JEU_CHOISI', { idJeu: msg.idJeu || 'dessin' });
        // Lancer le 1er tour (choix du mot pour le dessinateur)
        demarrerTourEtAnnoncer(code);
      }
    }

    // Le dessinateur choisit son mot → lancer le chrono et informer tout le monde
    else if (msg.type === 'CHOISIR_MOT') {
      const slot = parties[code];
      if (!slot || slot.idJeu !== 'dessin') return; // garde-fou : dessin uniquement
      const { partie } = slot;
      // Seul le dessinateur courant peut choisir le mot
      if (ws.idSocket !== partie.dessinateurId) return;
      const { nbLettres, duree } = partie.choisirMot(msg.mot);
      slot.debut = Date.now();
      slot.duree = duree;
      diffuser(code, 'TOUR_DEMARRE', { dessinateurId: partie.dessinateurId, nbLettres, duree });
      // Démarrer le chrono : fin automatique si le temps s'écoule
      slot.minuteur = setTimeout(() => finirTour(code), duree * 1000);
    }

    // Messages de dessin : relayer uniquement depuis le dessinateur courant vers les autres
    else if (['TRAIT_DEBUT', 'TRAIT_POINTS', 'TRAIT_FIN', 'ANNULER', 'EFFACER_TOUT', 'FOND'].includes(msg.type)) {
      const slot = parties[code];
      if (!slot || slot.idJeu !== 'dessin') return; // garde-fou : dessin uniquement
      if (ws.idSocket !== slot.partie.dessinateurId) return;
      // Relayer le message tel quel (en repassant toutes les propriétés sauf "type")
      const { type, ...donnees } = msg;
      relayerAuxAutres(ws, code, type, donnees);
    }

    // Un devineur envoie une réponse
    else if (msg.type === 'DEVINER') {
      const slot = parties[code];
      if (!slot || slot.idJeu !== 'dessin') return; // garde-fou : dessin uniquement
      const { partie } = slot;
      const r = partie.deviner(ws.idSocket, msg.texte, tempsRestant(code));
      if (r.resultat === 'exact') {
        const pseudo = pseudoDe(code, ws.idSocket);
        diffuser(code, 'A_TROUVE', { joueurId: ws.idSocket, pseudo });
        diffuser(code, 'SCORES', {
          joueurs: partie.classement().map(({ id, pseudo: p, points }) => ({ id, pseudo: p, points })),
        });
        if (partie.tousOntTrouve()) finirTour(code);
      } else if (r.resultat === 'proche') {
        const pseudo = pseudoDe(code, ws.idSocket);
        envoyer(ws, 'PRESQUE', { pseudo });
      } else if (r.resultat === 'faux') {
        const pseudo = pseudoDe(code, ws.idSocket);
        diffuser(code, 'MESSAGE_CHAT', { pseudo, texte: msg.texte });
      }
      // 'interdit', 'deja', 'inactif' → ignorer silencieusement
    }

    // Un joueur soumet un ticket gratté (Turbo Jackpot)
    else if (msg.type === 'TICKET_TERMINE') {
      const slot = parties[code];
      if (!slot || slot.idJeu !== 'turbo') return; // garde-fou : turbo uniquement
      const msEcoule = Date.now() - slot.debut;
      const r = slot.jeu.appliquerTicket(ws.idSocket, msg.symboles, Date.now());
      diffuser(code, 'ETAT_COURSE', { positions: slot.jeu.positions(), effets: r.effets });
      if (r.feed) diffuser(code, 'FEED', r.feed);
      // Vérifier si la course est terminée (temps écoulé OU un kart à l'arrivée)
      if (slot.jeu.estFinie(msEcoule)) finirCourse(code);
    }

    // Un joueur répond à une manche de Beboudle
    else if (msg.type === 'REPONDRE') {
      const slot = parties[code];
      if (!slot || slot.idJeu !== 'beboudle') return; // garde-fou : beboudle uniquement
      const r = slot.jeu.repondre(ws.idSocket, msg.personneId);
      if (!r.ok) return;
      diffuser(code, 'A_REPONDU', { pseudo: pseudoDe(code, ws.idSocket) });
      if (slot.jeu.tousOntRepondu()) finirMancheBeboudle(code);
    }
  });

  ws.on('close', () => {
    const codeSalle = ws.codeSalle;
    // Gérer la déconnexion dans la partie en cours avant de retirer le joueur de la salle
    if (codeSalle && parties[codeSalle]) {
      const slot = parties[codeSalle];
      if (slot.idJeu === 'dessin') {
        // Dessine-moi : notifier la partie et terminer le tour si nécessaire
        const r = slot.partie.joueurParti(ws.idSocket);
        if (r.tourTermine) finirTour(codeSalle);
      }
      // Turbo : la course continue sans le joueur déconnecté (pas de logique spéciale v1)
    }
    const r = gestion.retirer(ws.idSocket);
    if (r && !r.ferme) diffuserListe(r.code);
    if (r && r.ferme) diffuser(r.code, 'ERREUR', { code: 'SALLE_FERMEE', message: 'L\'hôte a quitté la partie' });
  });
});

// On écoute sur 0.0.0.0 pour accepter les connexions extérieures (téléphones / cloud).
serveurHttp.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur BebouParty démarré sur le port ${PORT}`);
});
