// src/ecrans/EcranJeuDessin.js
// Orchestrateur principal du mini-jeu « Devine le dessin ».
// Gère : abonnements réseau, état local du jeu, composition des sous-composants,
// bascule dessinateur ↔ devineur, overlays (choix mot, révélation).
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS, DEGRADE_FOND } from '../theme/couleurs';
import { POLICES, RAYONS } from '../theme/styles';
import Canvas from '../composants/jeu/Canvas';
import BarreOutils from '../composants/jeu/BarreOutils';
import ChatDevinettes from '../composants/jeu/ChatDevinettes';
import TableauScores from '../composants/jeu/TableauScores';
import ChronoBar from '../composants/jeu/ChronoBar';
import ChoixMot from '../composants/jeu/ChoixMot';
import RevelationTour from '../composants/jeu/RevelationTour';

export default function EcranJeuDessin({ navigation }) {
  // --- Identité ---
  // monId est stable : attribué une fois par le serveur
  const monId = Reseau.monId();

  // --- État du jeu ---
  const [joueurs, setJoueurs] = useState([]);          // liste complète
  const [dessinateurId, setDessinateurId] = useState(null);
  const [estDessinateur, setEstDessinateur] = useState(false);

  // Dessin
  const [traits, setTraits] = useState([]);
  const [fond, setFond] = useState('#ffffff');

  // Devinettes
  const [ontTrouve, setOntTrouve] = useState(new Set()); // Set d'ids
  const [messages, setMessages] = useState([]);

  // Mot
  const [motSecret, setMotSecret] = useState(null);    // visible du dessinateur seulement
  const [tirets, setTirets] = useState('');            // visible des devineurs

  // Chrono
  const [debut, setDebut] = useState(null);
  const [duree, setDuree] = useState(80);

  // Overlays
  const [choixMots, setChoixMots] = useState(null);   // null | string[3]
  const [revelation, setRevelation] = useState(null); // null | string

  // Scores
  const [scoresMap, setScoresMap] = useState({});     // { id: points }

  // --- Outils du dessinateur ---
  const [couleur, setCouleur] = useState('#000000');
  const [taille, setTaille] = useState(4);
  const [gommeActive, setGomme] = useState(false);

  // Helper : ajouter un message dans le chat
  const ajouterMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // --- Abonnements réseau (montage unique) ---
  useEffect(() => {
    const offs = [];

    // Liste des joueurs (anti-course : ClientReseau rejoue la dernière liste)
    offs.push(Reseau.sur('listeJoueurs', (joueurs) => setJoueurs(joueurs)));

    // Le serveur envoie les 3 mots uniquement au dessinateur
    offs.push(Reseau.sur('choixMots', (mots) => {
      setChoixMots(mots);
    }));

    // Préparation d'un nouveau tour (avant le choix du mot)
    offs.push(Reseau.sur('preparation', ({ dessinateurId: dId }) => {
      setDessinateurId(dId);
      // On réinitialise le tableau et l'overlay de révélation
      setTraits([]);
      setFond('#ffffff');
      setOntTrouve(new Set());
      setRevelation(null);
      setMotSecret(null);
    }));

    // Début effectif du tour (mot choisi par le dessinateur)
    offs.push(Reseau.sur('tourDemarre', ({ dessinateurId: dId, nbLettres, duree: d }) => {
      const jeSuisDessinateur = dId === Reseau.monId();
      setDessinateurId(dId);
      setEstDessinateur(jeSuisDessinateur);
      setTirets('_ '.repeat(nbLettres).trim());
      setDebut(Date.now());
      setDuree(d);
      setChoixMots(null); // fermer l'overlay si encore affiché
    }));

    // --- Événements de dessin (relayés par le serveur aux AUTRES joueurs) ---
    offs.push(Reseau.sur('traitDebut', (t) => {
      // Ajouter un nouveau trait avec un tableau de points vide
      setTraits((prev) => [...prev, { ...t, points: [] }]);
    }));

    offs.push(Reseau.sur('traitPoints', ({ id, points }) => {
      setTraits((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, points: [...t.points, ...points] } : t
        )
      );
    }));

    offs.push(Reseau.sur('traitFin', ({ id }) => {
      // On peut marquer le trait comme terminé si besoin ; pour l'instant on ne fait rien
      // (les points sont déjà là, le trait reste affiché)
    }));

    offs.push(Reseau.sur('annuler', () => {
      setTraits((prev) => prev.slice(0, -1));
    }));

    offs.push(Reseau.sur('effacerTout', () => {
      setTraits([]);
    }));

    offs.push(Reseau.sur('fond', (c) => {
      setFond(c);
    }));

    // --- Événements de devinettes ---
    offs.push(Reseau.sur('aTrouve', ({ joueurId, pseudo }) => {
      setOntTrouve((prev) => new Set(prev).add(joueurId));
      ajouterMessage({ type: 'found', pseudo });
    }));

    offs.push(Reseau.sur('presque', ({ pseudo }) => {
      ajouterMessage({ type: 'close', pseudo });
    }));

    offs.push(Reseau.sur('messageChat', ({ pseudo, texte }) => {
      ajouterMessage({ type: 'chat', pseudo, texte });
    }));

    // Mise à jour des scores en cours de tour
    offs.push(Reseau.sur('scores', (liste) => {
      // liste : [{ id, pseudo, points }]
      const map = {};
      (liste || []).forEach((j) => { map[j.id] = j.points; });
      setScoresMap(map);
    }));

    // Fin de tour → révéler le mot
    offs.push(Reseau.sur('tourFini', ({ mot }) => {
      setRevelation(mot);
    }));

    // Fin de partie → écran podium
    offs.push(Reseau.sur('partieFinie', (classement) => {
      navigation.replace('Podium', { classement });
    }));

    // Déconnexion → retour à l'accueil
    offs.push(Reseau.sur('deconnecte', () => {
      navigation.replace('Accueil');
    }));

    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Joueurs enrichis avec les scores courants ---
  const joueursAvecScores = joueurs.map((j) => ({
    ...j,
    points: scoresMap[j.id] ?? j.points ?? 0,
  }));

  // --- Callbacks du dessinateur (Canvas) ---

  // Début d'un trait : envoi réseau uniquement.
  // (Le Canvas gère l'affichage local du trait en cours → pas de re-render lourd ici.)
  const handleTraitDebut = useCallback((meta) => {
    Reseau.traitDebut(meta);
  }, []);

  // Lot de points : envoi réseau uniquement (l'affichage local est dans le Canvas).
  const handleTraitPoints = useCallback((id, points) => {
    Reseau.traitPoints(id, points);
  }, []);

  // Fin d'un trait : envoi réseau.
  const handleTraitFin = useCallback((id) => {
    Reseau.traitFin(id);
  }, []);

  // Trait terminé : on l'ajoute UNE fois aux traits affichés (côté dessinateur).
  const handleTraitTermine = useCallback((trait) => {
    setTraits((prev) => [...prev, trait]);
  }, []);

  // --- Callbacks de la BarreOutils ---

  const handleFond = useCallback((c) => {
    setFond(c);
    Reseau.changerFond(c);
  }, []);

  const handleAnnuler = useCallback(() => {
    setTraits((prev) => prev.slice(0, -1));
    Reseau.annulerTrait();
  }, []);

  const handleEffacer = useCallback(() => {
    setTraits([]);
    Reseau.effacerTout();
  }, []);

  // --- Callback du ChoixMot ---
  const handleChoisirMot = useCallback((mot) => {
    setMotSecret(mot);
    Reseau.choisirMot(mot);
    setChoixMots(null);
  }, []);

  // --- Callback du ChatDevinettes ---
  const handleEnvoyer = useCallback((texte) => {
    Reseau.deviner(texte);
  }, []);

  // --- Affichage du mot dans la barre du haut ---
  const affichageMot = estDessinateur
    ? (motSecret ? motSecret.toUpperCase().split('').join(' ') : '…')
    : (tirets || '');

  // --- Couleur effective passée au Canvas ---
  // Si la gomme est active, le trait a la couleur du fond (= effacement)
  const couleurEffective = gommeActive ? fond : couleur;

  // --- Rendu ---
  return (
    <LinearGradient colors={DEGRADE_FOND} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.fond}>
      <SafeAreaView style={styles.conteneur}>

        {/* ── BARRE SUPÉRIEURE : mot + chrono ── */}
        <View style={styles.barreHaut}>
          <View style={styles.zoneMotChrono}>
            {/* Mot / tirets */}
            <Text style={[styles.mot, estDessinateur && styles.motDessinateur]} numberOfLines={1} adjustsFontSizeToFit>
              {affichageMot || '…'}
            </Text>
            {/* Compte à rebours */}
            {debut !== null && (
              <ChronoBar duree={duree} debut={debut} />
            )}
          </View>
        </View>

        {/* ── TABLEAU DES SCORES ── */}
        <View style={styles.zoneScores}>
          <TableauScores
            joueurs={joueursAvecScores}
            dessinateurId={dessinateurId}
            ontTrouve={ontTrouve}
            monId={monId}
          />
        </View>

        {/* ── ZONE PRINCIPALE : canvas + panneau latéral ── */}
        <View style={styles.zoneJeu}>
          {/* Canvas de dessin */}
          <View style={styles.zoneCanvas}>
            <Canvas
              traits={traits}
              fond={fond}
              interactif={estDessinateur}
              couleur={couleurEffective}
              taille={taille}
              onTraitDebut={handleTraitDebut}
              onTraitPoints={handleTraitPoints}
              onTraitFin={handleTraitFin}
              onTraitTermine={handleTraitTermine}
            />
          </View>

          {/* Chat (devineur seulement) affiché à droite sur tablette ;
              sinon en bas sur téléphone — la mise en page est verticale ici */}
          {!estDessinateur && (
            <View style={styles.zoneChat}>
              <ChatDevinettes
                messages={messages}
                onEnvoyer={handleEnvoyer}
                desactive={ontTrouve.has(monId)}
              />
            </View>
          )}
        </View>

        {/* ── OUTILS (dessinateur) ── */}
        {estDessinateur && (
          <View style={styles.zoneOutils}>
            <BarreOutils
              couleur={couleur}
              setCouleur={setCouleur}
              taille={taille}
              setTaille={setTaille}
              gommeActive={gommeActive}
              setGomme={setGomme}
              onFond={handleFond}
              onAnnuler={handleAnnuler}
              onEffacer={handleEffacer}
            />
          </View>
        )}

      </SafeAreaView>

      {/* ── OVERLAY : choix du mot ── */}
      <ChoixMot mots={choixMots} onChoisir={handleChoisirMot} />

      {/* ── OVERLAY : révélation fin de tour ── */}
      <RevelationTour mot={revelation} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  conteneur: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },

  // Barre du haut : mot + chrono
  barreHaut: {
    backgroundColor: 'rgba(43,27,71,0.55)',
    borderRadius: RAYONS.petit,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zoneMotChrono: {
    gap: 6,
  },
  mot: {
    fontFamily: POLICES.texteGras,
    fontSize: 20,
    color: COULEURS.texteDoux,
    textAlign: 'center',
    letterSpacing: 3,
  },
  motDessinateur: {
    color: COULEURS.jaune,
    fontFamily: POLICES.titre,
    fontSize: 22,
  },

  // Tableau des scores
  zoneScores: {
    // Hauteur fixe pour que le canvas prenne le reste
    height: 80,
  },

  // Zone principale : canvas + chat (défilement vertical sur téléphone)
  zoneJeu: {
    flex: 1,
    gap: 8,
  },
  zoneCanvas: {
    flex: 2,           // Canvas prend 2/3
    borderRadius: RAYONS.carte,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  zoneChat: {
    flex: 1,           // Chat prend 1/3
    minHeight: 140,
  },

  // Barre d'outils (dessinateur)
  zoneOutils: {
    // Hauteur automatique selon contenu de BarreOutils
  },
});
