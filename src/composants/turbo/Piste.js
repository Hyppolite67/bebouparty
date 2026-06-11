// src/composants/turbo/Piste.js
// Zone haute de l'écran Turbo Jackpot : fond foncé arrondi, ligne d'arrivée à damier,
// une lane par joueur avec Mascotte + pseudo + kart (🏎️ pointant vers la droite).
// Le kart se déplace avec une animation Reanimated (withTiming) quand la position change.
// Les effets (boost, recule, bouclier, ralenti, echange) déclenchent des animations visuelles.

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Mascotte from '../Mascotte';
import { COULEURS } from '../../theme/couleurs';
import { POLICES } from '../../theme/styles';

// Pourcentage de gauche selon la position (0..longueur) → ~5% à ~82%
// On réserve ~15% à droite pour la ligne d'arrivée et un peu de marge
function posEnPourcent(pos, longueur) {
  return 5 + (pos / longueur) * 77; // 5% min, 82% max
}

// --- Kart animé : un kart par joueur ---
function KartJoueur({ joueur, position, longueur, effetActif }) {
  // Position horizontale en %
  const translateX = useSharedValue(posEnPourcent(position, longueur));

  // Animations d'effet
  const flashOpacity = useSharedValue(0);     // flash boost/recule
  const flashCouleur = useRef(COULEURS.jaune);
  const secoue = useSharedValue(0);           // tremblement recule
  const bouclierOpacity = useSharedValue(0);  // aura bouclier
  const teinteBleue = useSharedValue(0);      // ralenti
  const rotation = useSharedValue(0);         // échange tourbillon
  const escargotOpacity = useSharedValue(0);  // 🐌 ralenti

  // Mise à jour de la position avec transition douce
  useEffect(() => {
    translateX.value = withTiming(posEnPourcent(position, longueur), {
      duration: 450,
      easing: Easing.out(Easing.quad),
    });
  }, [position, longueur]);

  // Déclenchement des animations d'effet
  useEffect(() => {
    if (!effetActif) return;

    switch (effetActif) {
      case 'boost':
        flashCouleur.current = COULEURS.jaune;
        // Flash doré bref (0 → 1 → 0 en 600 ms)
        flashOpacity.value = withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0.6, { duration: 200 }),
          withTiming(0, { duration: 320 }),
        );
        break;

      case 'recule':
        flashCouleur.current = COULEURS.erreur;
        // Flash rouge
        flashOpacity.value = withSequence(
          withTiming(0.8, { duration: 80 }),
          withTiming(0, { duration: 400 }),
        );
        // Tremblement horizontal rapide (3 aller-retours)
        secoue.value = withSequence(
          withRepeat(
            withSequence(
              withTiming(3, { duration: 60 }),
              withTiming(-3, { duration: 60 }),
            ),
            3,
            true,
          ),
          withTiming(0, { duration: 60 }),
        );
        break;

      case 'bouclier':
        // Aura violette pulsante pendant ~3 s (6 pulsations)
        bouclierOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 350 }),
            withTiming(0.3, { duration: 350 }),
          ),
          6,
          false,
        );
        break;

      case 'ralenti':
        // Teinte bleue + escargot visible pendant ~3 s
        teinteBleue.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(1, { duration: 2600 }),
          withTiming(0, { duration: 400 }),
        );
        escargotOpacity.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(1, { duration: 2600 }),
          withTiming(0, { duration: 400 }),
        );
        break;

      case 'echange':
        // Rotation rapide (tourbillon) + clignotement
        rotation.value = withSequence(
          withTiming(360, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 0 }),
        );
        flashCouleur.current = '#A855F7'; // violet
        flashOpacity.value = withSequence(
          withTiming(0.7, { duration: 100 }),
          withTiming(0, { duration: 150 }),
          withTiming(0.7, { duration: 100 }),
          withTiming(0, { duration: 200 }),
        );
        break;
    }
  }, [effetActif]);

  // Styles animés du kart
  const styleKart = useAnimatedStyle(() => ({
    left: `${translateX.value}%`,
    transform: [
      { translateX: secoue.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  // Flash coloré (boost = doré, recule = rouge, echange = violet)
  const styleFlash = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: flashCouleur.current,
  }));

  // Aura bouclier
  const styleBouclier = useAnimatedStyle(() => ({
    opacity: bouclierOpacity.value,
  }));

  // Teinte bleue (ralenti)
  const styleRalenti = useAnimatedStyle(() => ({
    opacity: teinteBleue.value,
  }));

  // Escargot flottant (ralenti)
  const styleEscargot = useAnimatedStyle(() => ({
    opacity: escargotOpacity.value,
  }));

  return (
    <Animated.View style={[styles.kart, styleKart]}>
      {/* Escargot ralenti (au-dessus du kart) */}
      <Animated.Text style={[styles.escargot, styleEscargot]}>🐌</Animated.Text>

      {/* Pseudo */}
      <Text style={styles.pseudo} numberOfLines={1}>{joueur.pseudo}</Text>

      {/* Avatar mascotte */}
      <View style={styles.avatarWrap}>
        {/* Aura bouclier violette */}
        <Animated.View style={[styles.auraAbsolue, styleBouclier]} />
        <Mascotte
          config={joueur.mascotte}
          taille={28}
          anime={false}
        />
      </View>

      {/* Kart retourné vers la droite (scaleX:-1 car l'emoji pointe à gauche nativement) */}
      <View style={styles.vehiculeWrap}>
        {/* Flash doré/rouge/violet par-dessus le kart */}
        <Animated.View style={[styles.flashAbsolu, styleFlash]} />
        {/* Teinte bleue ralenti */}
        <Animated.View style={[styles.teinteBleueAbsolue, styleRalenti]} />
        <Text style={styles.vehicule}>🏎️</Text>
      </View>
    </Animated.View>
  );
}

// --- Composant principal Piste ---
export default function Piste({ joueurs = [], positions = {}, longueur = 20, effets = [] }) {
  // On construit un map joueurId → dernier effet pour ce joueur
  // (on utilise une clé qui change pour re-déclencher useEffect)
  const derniersEffets = {};
  for (const e of effets) {
    derniersEffets[e.joueurId] = e.type;
  }

  return (
    <View style={styles.piste}>
      {/* Ligne d'arrivée à damier (droite) */}
      <View style={styles.ligneArrivee} />

      {/* Lanes */}
      {joueurs.map((joueur, idx) => (
        <View
          key={joueur.id}
          style={[
            styles.lane,
            idx < joueurs.length - 1 && styles.laneSeparateur,
          ]}
        >
          <KartJoueur
            joueur={joueur}
            position={positions[joueur.id] ?? 0}
            longueur={longueur}
            // On passe une chaîne composée du type + un timestamp pour re-déclencher
            // useEffect même si le même effet arrive deux fois de suite
            effetActif={derniersEffets[joueur.id] ?? null}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const TAILLE_KART = 22;  // emoji kart
const TAILLE_MASCOTTE = 28;

const styles = StyleSheet.create({
  // Conteneur principal
  piste: {
    flex: 1,                       // remplit la zone haute (sinon la piste se réduit à rien)
    backgroundColor: '#160a28',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: 'hidden',
    position: 'relative',
  },

  // Ligne d'arrivée à damier
  ligneArrivee: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    right: 10,
    width: 14,
    borderRadius: 4,
    // Damier simulé avec des dégradés répétés (React Native ne supporte pas repeating-linear-gradient)
    // On utilise un fond alterné via backgroundColor + opacity
    backgroundColor: '#222',
    opacity: 0.85,
    // Le motif damier est rendu grâce à des bordures encaissées (voir overlay ci-dessous)
  },

  // Overlay damier (calque par-dessus ligneArrivee — non nécessaire, couleur alternée suffit en RN)
  // On simplifie : fond sombre avec contour blanc visible
  lane: {
    position: 'relative',
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  laneSeparateur: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },

  // Kart (positionné en absolu dans la lane, centré verticalement)
  kart: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // On décale d'un demi-kart pour centrer sur la position
    marginLeft: -14,
  },

  pseudo: {
    fontFamily: POLICES.texteGras,
    fontSize: 9,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: 60,
  },

  avatarWrap: {
    width: TAILLE_MASCOTTE,
    height: TAILLE_MASCOTTE,
    borderRadius: TAILLE_MASCOTTE / 2,
    overflow: 'hidden',
    marginVertical: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },

  auraAbsolue: {
    position: 'absolute',
    inset: -4,
    borderRadius: (TAILLE_MASCOTTE / 2) + 4,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowRadius: 8,
    shadowOpacity: 0.9,
    elevation: 6,
  },

  vehiculeWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  vehicule: {
    fontSize: TAILLE_KART,
    // Retourné vers la droite : l'emoji 🏎️ pointe naturellement à droite dans la plupart
    // des polices, mais scaleX(-1) garantit qu'il pointe vers la droite (ligne d'arrivée)
    transform: [{ scaleX: -1 }],
  },

  flashAbsolu: {
    position: 'absolute',
    width: TAILLE_KART + 10,
    height: TAILLE_KART + 6,
    borderRadius: 8,
    zIndex: 1,
  },

  teinteBleueAbsolue: {
    position: 'absolute',
    width: TAILLE_KART + 10,
    height: TAILLE_KART + 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.55)',
    zIndex: 1,
  },

  escargot: {
    fontSize: 13,
    marginBottom: -2,
    zIndex: 2,
  },
});
