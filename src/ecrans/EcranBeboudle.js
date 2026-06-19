// src/ecrans/EcranBeboudle.js
// Orchestrateur du mini-jeu « Beboudle » : abonnements réseau, état de la manche,
// composition des sous-composants. Même structure que EcranJeuDessin / EcranTurboJackpot.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeOut, useSharedValue, useAnimatedStyle, withSequence, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Reseau from '../reseau/ClientReseau';
import { DEGRADE_FOND, COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';
import CaseEmoji from '../composants/beboudle/CaseEmoji';
import BoutonPersonne from '../composants/beboudle/BoutonPersonne';
import TimerIndice from '../composants/beboudle/TimerIndice';
import ScoresManche from '../composants/beboudle/ScoresManche';

const POINTS_PAR_INDICE = { 1: 500, 2: 300, 3: 150, 4: 50 };

// Compte à rebours « 3 · 2 · 1 · GO » au lancement (comme la course Turbo).
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

export default function EcranBeboudle({ navigation }) {
  const monId = Reseau.monId();

  const [manche, setManche] = useState(0);
  const [total, setTotal] = useState(0);
  const [choix, setChoix] = useState([]);                 // [{ id, nom }]
  const [emojisReveles, setEmojisReveles] = useState([null, null, null, null]);
  const [debutIndice, setDebutIndice] = useState(null);   // ms du dernier indice révélé
  const [maReponse, setMaReponse] = useState(null);       // personneId choisi
  const [feedback, setFeedback] = useState(null);         // texte du toast
  const [finManche, setFinManche] = useState(null);       // { bonneReponse, reponses, scores }
  const [monScore, setMonScore] = useState(0);
  const [compte, setCompte] = useState(null);             // 3 · 2 · 1 · GO au lancement

  const toastTimer = useRef(null);
  const premiereManche = useRef(true);

  function lancerCompteARebours() {
    const etapes = [3, 2, 1, 'GO'];
    etapes.forEach((v, i) => setTimeout(() => {
      setCompte(v);
      Haptics.impactAsync(v === 'GO' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    }, i * 600));
    setTimeout(() => setCompte(null), etapes.length * 600);
  }
  const indiceActuel = emojisReveles.filter((e) => e !== null).length; // 1..4

  function montrerToast(texte) {
    setFeedback(texte);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setFeedback(null), 2000);
  }

  useEffect(() => {
    const offs = [];

    offs.push(Reseau.sur('beboudleManche', ({ manche: m, total: t, choix: c }) => {
      setManche(m); setTotal(t); setChoix(c);
      setEmojisReveles([null, null, null, null]);
      setMaReponse(null); setFinManche(null);
      // Compte à rebours « 3 · 2 · 1 · GO » au tout début de la partie.
      if (premiereManche.current) { premiereManche.current = false; lancerCompteARebours(); }
    }));

    offs.push(Reseau.sur('revelerIndice', ({ indice, emoji }) => {
      setEmojisReveles((prev) => { const c = [...prev]; c[indice - 1] = emoji; return c; });
      setDebutIndice(Date.now());
    }));

    offs.push(Reseau.sur('aRepondu', ({ pseudo }) => montrerToast(`${pseudo} a répondu !`)));

    offs.push(Reseau.sur('beboudleMancheFinie', (res) => {
      setFinManche(res);
      const moi = (res.scores || []).find((j) => j.id === monId);
      if (moi) setMonScore(moi.points);
    }));

    offs.push(Reseau.sur('beboudleFinie', (classement) => {
      navigation.replace('Podium', { classement });
    }));

    offs.push(Reseau.sur('deconnecte', () => navigation.replace('Accueil')));

    return () => { offs.forEach((off) => off()); clearTimeout(toastTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choisir(personneId) {
    if (maReponse !== null || finManche) return;
    setMaReponse(personneId);
    Reseau.repondre(personneId);
  }

  // Détermine l'état d'un bouton.
  function etatBouton(personneId) {
    if (finManche) {
      if (personneId === finManche.bonneReponse.id) return 'bon';
      if (personneId === maReponse) return 'mauvais';
      return 'normal';
    }
    return personneId === maReponse ? 'choisi' : 'normal';
  }

  const aRepondu = maReponse !== null;
  const gainAffiche = finManche ? POINTS_PAR_INDICE[indiceActuel] : null;

  return (
    <LinearGradient colors={DEGRADE_FOND} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.fond}>
      <SafeAreaView style={styles.conteneur}>

        {/* HAUT : manche + score */}
        <View style={styles.top}>
          <Text style={styles.manche}>MANCHE {manche}/{total}</Text>
          <View style={styles.score}>
            <Text style={styles.scoreIc}>🏆</Text>
            <Text style={styles.scorePts}>{monScore} pts</Text>
          </View>
        </View>

        {/* 4 CASES EMOJIS */}
        <View style={styles.cases}>
          {[0, 1, 2, 3].map((i) => (
            <CaseEmoji key={i} numero={i + 1} emoji={emojisReveles[i]} revele={emojisReveles[i] !== null} />
          ))}
        </View>

        {/* TIMER */}
        {debutIndice !== null && indiceActuel < 4 && !finManche && (
          <TimerIndice duree={15} debut={debutIndice} />
        )}

        {/* BARÈME */}
        <View style={styles.bareme}>
          <Text style={styles.baremeTxt}>
            1 indice <Text style={styles.or}>500</Text> · 2 <Text style={styles.or}>300</Text> · 3 <Text style={styles.or}>150</Text> · 4 <Text style={styles.or}>50</Text> · faux <Text style={styles.or}>−100</Text>
          </Text>
        </View>

        {/* FEEDBACK */}
        <View style={styles.feedback}>
          {feedback && (
            <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOut.duration(180)} style={styles.toast}>
              <View style={styles.toastDot} />
              <Text style={styles.toastTxt}>{feedback}</Text>
            </Animated.View>
          )}
        </View>

        {/* 6 BOUTONS (2 colonnes x 3 lignes) */}
        <View style={styles.grille}>
          {[[0, 1], [2, 3], [4, 5]].map((paire, r) => (
            <View key={r} style={styles.rangee}>
              {paire.map((idx) => {
                const p = choix[idx];
                if (!p) return <View key={idx} style={{ flex: 1 }} />;
                return (
                  <BoutonPersonne
                    key={p.id}
                    nom={p.nom}
                    etat={etatBouton(p.id)}
                    gain={gainAffiche}
                    disabled={aRepondu || !!finManche}
                    onPress={() => choisir(p.id)}
                  />
                );
              })}
            </View>
          ))}
        </View>

      </SafeAreaView>

      {/* OVERLAY scores de fin de manche */}
      {finManche && (
        <ScoresManche
          bonneReponse={finManche.bonneReponse}
          scores={finManche.scores}
          monId={monId}
        />
      )}

      {/* Compte à rebours « 3 · 2 · 1 · GO » */}
      {compte !== null && <CompteARebours valeur={compte} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  conteneur: { flex: 1, paddingHorizontal: 13, paddingTop: 6, paddingBottom: 10, gap: 12 },

  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manche: {
    fontFamily: POLICES.titreMoyen, fontSize: 16, letterSpacing: 4, color: COULEURS.jaune,
    textShadowColor: 'rgba(255,215,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  score: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.30)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14, paddingHorizontal: 11, paddingVertical: 5,
  },
  scoreIc: { fontSize: 14 },
  scorePts: { fontFamily: POLICES.titreMoyen, fontSize: 15, color: COULEURS.blanc },

  cases: { flexDirection: 'row', gap: 11, justifyContent: 'center' },

  bareme: { alignItems: 'center' },
  baremeTxt: { fontFamily: POLICES.texte, fontSize: 11, color: 'rgba(255,255,255,0.72)' },
  or: { color: COULEURS.jaune, fontFamily: POLICES.texteGras },

  feedback: { minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  toastDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#A855F7' },
  toastTxt: { fontFamily: POLICES.texteGras, fontSize: 13, color: COULEURS.blanc },

  grille: { flex: 1, gap: 12, marginTop: 8 },
  rangee: { flex: 1, flexDirection: 'row', gap: 12 },

  compteOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,10,34,0.55)',
    zIndex: 60,
  },
  compteTexte: {
    fontFamily: POLICES.titre,
    fontSize: 110,
    color: COULEURS.jaune,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
});
