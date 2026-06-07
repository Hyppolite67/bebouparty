// serveur/mots.js
// Liste de mots français simples et faciles à dessiner.
// Sans accents pour simplifier la comparaison (ex. "etoile" au lieu de "étoile").
// Catégories : animaux, objets, nourriture, lieux, actions, véhicules, vêtements, nature.

const MOTS = [
  // Animaux (30)
  'chat', 'chien', 'poisson', 'oiseau', 'lapin', 'cochon', 'vache', 'cheval',
  'mouton', 'canard', 'grenouille', 'serpent', 'lion', 'elephant', 'girafe',
  'singe', 'tigre', 'ours', 'loup', 'renard', 'hibou', 'requin', 'dauphin',
  'tortue', 'papillon', 'abeille', 'araignee', 'fourmi', 'crocodile', 'pingouin',

  // Nourriture (30)
  'pizza', 'gateau', 'glace', 'pomme', 'banane', 'fraise', 'cerise', 'ananas',
  'citron', 'raisin', 'carotte', 'brocoli', 'champignon', 'oeuf', 'fromage',
  'pain', 'baguette', 'croissant', 'hamburger', 'frite', 'bonbon', 'chocolat',
  'tarte', 'cookie', 'cafe', 'jus', 'lait', 'popcorn', 'sushi', 'sandwich',

  // Objets du quotidien (30)
  'maison', 'voiture', 'telephone', 'ordinateur', 'livre', 'stylo', 'sac',
  'chaise', 'table', 'lampe', 'television', 'fenetre', 'porte', 'lit', 'miroir',
  'ballon', 'parapluie', 'lunettes', 'montre', 'cle', 'cadenas', 'marteau',
  'ciseaux', 'peigne', 'brosse', 'savon', 'bouteille', 'tasse', 'assiette', 'couteau',

  // Nature & lieux (25)
  'arbre', 'fleur', 'montagne', 'plage', 'soleil', 'lune', 'etoile', 'nuage',
  'pluie', 'neige', 'arc-en-ciel', 'volcan', 'desert', 'foret', 'ile', 'lac',
  'riviere', 'mer', 'pont', 'route', 'jardin', 'parc', 'chateau', 'phare', 'iglou',

  // Véhicules & transports (15)
  'avion', 'bateau', 'train', 'bus', 'velo', 'moto', 'fusee', 'helicoptere',
  'camion', 'tracteur', 'ambulance', 'pompier', 'taxi', 'voilier', 'sous-marin',

  // Vêtements & accessoires (15)
  'chapeau', 'chaussure', 'manteau', 'robe', 'pantalon', 'pull', 'gant',
  'echarpe', 'cravate', 'pyjama', 'maillot', 'short', 'casquette', 'botte', 'socquette',

  // Divers : magie, fantastique, jeux (15)
  'robot', 'fantome', 'dinosaure', 'licorne', 'dragon', 'sorciere', 'fee',
  'pirate', 'astronaute', 'super-heros', 'zombie', 'alien', 'monstre', 'chevalier', 'ninja',
];

// Tire 3 mots distincts, en évitant ceux de `exclus` (un Set) si possible.
function tirerTrois(exclus = new Set()) {
  let dispo = MOTS.filter((m) => !exclus.has(m));
  if (dispo.length < 3) dispo = [...MOTS]; // sécurité si presque tout est exclu
  const choix = [];
  const copie = [...dispo];
  while (choix.length < 3 && copie.length) {
    const i = Math.floor(Math.random() * copie.length);
    choix.push(copie.splice(i, 1)[0]);
  }
  return choix;
}

module.exports = { MOTS, tirerTrois };
