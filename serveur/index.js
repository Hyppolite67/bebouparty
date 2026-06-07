// Point d'entrée de secours.
// Certains hébergeurs (comme Render) lancent "node index.js" par défaut.
// On redirige simplement vers le vrai serveur pour que ça marche dans tous les cas.
require('./serveur.js');
