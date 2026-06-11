// src/ecrans/EcranTurboJackpot.js
// Orchestrateur du mini-jeu « Turbo Jackpot ».
// Gère : abonnements réseau, état de la course, composition des sous-composants.
// Layout : ChronoBar + Piste (haut ~40%) — zone ticket : FilDirect + TicketGratter (bas ~60%).
// La BanniereCombo s'affiche en overlay au-dessus du ticket pendant 1,5 s.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Reseau from '../reseau/ClientReseau';
import { decrireCombo } from '../donnees/symboles';
import { DEGRADE_FOND, COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';
import ChronoBar from '../composants/jeu/ChronoBar';
import Piste from '../composants/turbo/Piste';
import TicketGratter from '../composants/turbo/TicketGratter';
import BanniereCombo from '../composants/turbo/BanniereCombo';
import FilDirect from '../composants/turbo/FilDirect';

// Couleur de flash plein écran selon le "ton" du combo / effet.
const COULEUR_TON = { vert: '#34D399', rouge: '#EF4444', bleu: '#3B82F6', dore: '#FFD700' };

// Compte à rebours « 3 · 2 · 1 · GO » au départ de la course.
function CompteARebours({ valeur }) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = 0;
    s.value = withSequence(withTiming(1.35, { duration: 180 }), withTiming(1, { duration: 130 }));
  }, [valeur]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <View style={styles.compteOverlay} pointerEvents="none">
      <Animated.Text style={[styles.compteTexte, st]}>{valeur}</Animated.Text>
    </View>
  );
}

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

  // --- Règle anti-poisse : après 5 tickets nuls d'affilée, le suivant est garanti bon ---
  const streakNul = useRef(0);
  const [forcerBon, setForcerBon] = useState(false);

  // --- Compte à rebours de départ ---
  const [compte, setCompte] = useState(null);
  function lancerCompteARebours() {
    const etapes = [3, 2, 1, 'GO'];
    etapes.forEach((v, i) => setTimeout(() => {
      setCompte(v);
      Haptics.impactAsync(v === 'GO' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    }, i * 700));
    setTimeout(() => setCompte(null), etapes.length * 700);
  }

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
      lancerCompteARebours();
    }));

    // Mise à jour de l'état de la course (positions + effets visuels)
    offs.push(Reseau.sur('etatCourse', ({ positions: pos, effets: eff }) => {
      setPositions(pos);
      setEffets(eff);
      // Si JE suis concerné par un effet, l'écran réagit (flash + éventuel tremblement).
      const moi = Reseau.monId();
      const miens = (eff || []).filter((x) => x.joueurId === moi);
      if (miens.some((x) => x.type === 'recule')) { flash('rouge'); trembler(10); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
      else if (miens.some((x) => x.type === 'echange')) { flash('dore'); trembler(8); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
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

    // Règle anti-poisse : on compte les tickets nuls d'affilée ; à partir de 5,
    // le prochain ticket est garanti bon (forcerBon).
    if (combo.nom === 'AUCUN') streakNul.current += 1; else streakNul.current = 0;
    setForcerBon(streakNul.current >= 5);

    // Jus visuel + vibration selon le résultat
    flash(combo.ton);
    if (combo.ton === 'dore' || combo.ton === 'rouge') trembler(10);
    if (combo.ton === 'dore' || combo.ton === 'vert') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (combo.ton === 'rouge') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

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
              forcerBon={forcerBon}
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

      {/* Compte à rebours de départ « 3 · 2 · 1 · GO » */}
      {compte !== null && <CompteARebours valeur={compte} />}
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

  // Compte à rebours de départ
  compteOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,10,34,0.45)',
    zIndex: 50,
  },
  compteTexte: {
    fontFamily: POLICES.titre,
    fontSize: 96,
    color: COULEURS.jaune,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
});
