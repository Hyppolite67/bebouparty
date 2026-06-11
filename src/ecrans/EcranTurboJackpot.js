// src/ecrans/EcranTurboJackpot.js
// Orchestrateur du mini-jeu « Turbo Jackpot ».
// Gère : abonnements réseau, état de la course, composition des sous-composants.
// Layout : ChronoBar + Piste (haut ~40%) — zone ticket : FilDirect + TicketGratter (bas ~60%).
// La BanniereCombo s'affiche en overlay au-dessus du ticket pendant 1,5 s.

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import * as Reseau from '../reseau/ClientReseau';
import { decrireCombo } from '../donnees/symboles';
import { DEGRADE_FOND } from '../theme/couleurs';

// Couleur de flash plein écran selon le "ton" du combo / effet.
const COULEUR_TON = { vert: '#34D399', rouge: '#EF4444', bleu: '#3B82F6', dore: '#FFD700' };
import ChronoBar from '../composants/jeu/ChronoBar';
import Piste from '../composants/turbo/Piste';
import TicketGratter from '../composants/turbo/TicketGratter';
import BanniereCombo from '../composants/turbo/BanniereCombo';
import FilDirect from '../composants/turbo/FilDirect';

export default function EcranTurboJackpot({ navigation }) {
  // --- État de la course ---
  const [joueurs, setJoueurs] = useState([]);          // liste des joueurs (pseudo, mascotte, id)
  const [positions, setPositions] = useState({});      // { id: 0..20 }
  const [effets, setEffets] = useState([]);            // [{ joueurId, type }] — derniers effets reçus
  const [feed, setFeed] = useState(null);              // { message, ton } — dernier événement fil
  const [banniere, setBanniere] = useState(null);      // null | { nom, description, ton, icone }
  const [debut, setDebut] = useState(null);            // Date.now() au moment de courseDemarre
  const [duree, setDuree] = useState(60);              // durée totale en secondes

  // --- Numéro du ticket courant (la prop `key` change → TicketGratter se remonte) ---
  const [numeroTicket, setNumeroTicket] = useState(1);

  // --- Effets d'écran (tremblement + flash coloré plein écran) ---
  const secousse = useSharedValue(0);
  const flashOpacite = useSharedValue(0);
  const [couleurFlash, setCouleurFlash] = useState('#FFD700');

  function flash(ton) {
    setCouleurFlash(COULEUR_TON[ton] || '#FFD700');
    flashOpacite.value = withSequence(withTiming(0.45, { duration: 70 }), withTiming(0, { duration: 320 }));
  }
  function trembler(force = 9) {
    secousse.value = withSequence(
      withRepeat(withSequence(withTiming(force, { duration: 45 }), withTiming(-force, { duration: 45 })), 4, true),
      withTiming(0, { duration: 45 }),
    );
  }

  const styleSecousse = useAnimatedStyle(() => ({ transform: [{ translateX: secousse.value }] }));
  const styleFlash = useAnimatedStyle(() => ({ opacity: flashOpacite.value }));

  // --- Abonnements réseau (montage unique) ---
  useEffect(() => {
    const offs = [];

    // Le serveur démarre la course → on initialise l'état
    offs.push(Reseau.sur('courseDemarre', ({ duree: d, positions: pos, joueurs: j }) => {
      setJoueurs(j);
      setPositions(pos);
      setDuree(d);
      setDebut(Date.now());
    }));

    // Mise à jour de l'état de la course (positions + effets visuels)
    offs.push(Reseau.sur('etatCourse', ({ positions: pos, effets: eff }) => {
      setPositions(pos);
      setEffets(eff);
      // Si JE suis concerné par un effet, l'écran réagit (flash + éventuel tremblement).
      const moi = Reseau.monId();
      const miens = (eff || []).filter((x) => x.joueurId === moi);
      if (miens.some((x) => x.type === 'recule')) { flash('rouge'); trembler(10); }
      else if (miens.some((x) => x.type === 'echange')) { flash('dore'); trembler(8); }
      else if (miens.some((x) => x.type === 'boost')) { flash('vert'); }
    }));

    // Fil en direct (dernier événement notable)
    offs.push(Reseau.sur('feed', (f) => setFeed(f)));

    // Fin de course → écran podium
    offs.push(Reseau.sur('courseFinie', (classement) => {
      navigation.replace('Podium', { classement });
    }));

    // Déconnexion → retour à l'accueil
    offs.push(Reseau.sur('deconnecte', () => {
      navigation.replace('Accueil');
    }));

    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Callback ticket complété ---
  // Appelé par TicketGratter quand les 3 cases sont révélées.
  function surTicket(symboles) {
    // Envoyer le ticket au serveur (qui applique l'effet et diffuse l'état)
    Reseau.ticketTermine(symboles);

    // Affichage local immédiat de la bannière combo (sans attendre le serveur)
    const combo = decrireCombo(symboles);
    setBanniere(combo);

    // Jus visuel : flash plein écran (couleur du combo) + tremblement sur les gros combos
    flash(combo.ton);
    if (combo.ton === 'dore' || combo.ton === 'rouge') trembler(10);

    // Masquer la bannière après 1,5 s
    setTimeout(() => setBanniere(null), 1500);

    // Nouveau ticket automatique après 1,5 s (en changeant la key du TicketGratter)
    setTimeout(() => setNumeroTicket((n) => n + 1), 1500);
  }

  // --- Rendu ---
  return (
    <LinearGradient
      colors={DEGRADE_FOND}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.fond}
    >
      <Animated.View style={[styles.fond, styleSecousse]}>
      <SafeAreaView style={styles.conteneur}>

        {/* ── HAUT (~40%) : chrono + piste ── */}
        <View style={styles.zoneHaute}>
          {/* Compte à rebours */}
          {debut !== null && (
            <View style={styles.chronoWrap}>
              <ChronoBar duree={duree} debut={debut} />
            </View>
          )}
          {/* Piste des karts */}
          <View style={styles.pisteWrap}>
            <Piste
              joueurs={joueurs}
              positions={positions}
              longueur={20}
              effets={effets}
            />
          </View>
        </View>

        {/* ── BAS (~60%) : zone ticket ── */}
        <View style={styles.zoneBasse}>
          {/* Fil en direct (si un message existe) */}
          {feed && (
            <View style={styles.filWrap}>
              <FilDirect message={feed.message} ton={feed.ton} />
            </View>
          )}

          {/* Zone ticket avec overlay bannière */}
          <View style={styles.ticketConteneur}>
            {/* Le ticket (key change → remonte le composant = nouveau ticket) */}
            <TicketGratter
              key={numeroTicket}
              numero={numeroTicket}
              onTicketComplet={surTicket}
            />

            {/* Overlay bannière combo (affiché par-dessus le ticket) */}
            {banniere !== null && (
              <View style={styles.banniereOverlay} pointerEvents="none">
                <BanniereCombo {...banniere} />
              </View>
            )}
          </View>
        </View>

      </SafeAreaView>
      </Animated.View>

      {/* Flash plein écran (couleur du combo / de l'effet reçu) */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: couleurFlash }, styleFlash]}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
  },
  conteneur: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },

  // Zone haute : chrono + piste (~40% de la hauteur disponible)
  zoneHaute: {
    flex: 4,
    gap: 8,
  },
  chronoWrap: {
    // ChronoBar s'adapte automatiquement en hauteur
  },
  pisteWrap: {
    flex: 1,
  },

  // Zone basse : fil + ticket (~60% de la hauteur disponible)
  zoneBasse: {
    flex: 6,
    gap: 8,
  },
  filWrap: {
    // FilDirect s'adapte automatiquement en hauteur
  },

  // Le conteneur du ticket (position relative pour l'overlay)
  ticketConteneur: {
    flex: 1,
    position: 'relative',
  },

  // Overlay de la bannière par-dessus le ticket
  banniereOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Léger fond semi-transparent pour que la bannière ressorte bien
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 22,
    zIndex: 10,
  },
});
