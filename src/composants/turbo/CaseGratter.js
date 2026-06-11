// src/composants/turbo/CaseGratter.js
// Une case à gratter — composant PASSIF (le tactile est géré par TicketGratter).
//
// SANS <Mask> (pas de crash natif) : la couche « argent » est une grille de
// petites tuiles ; on dessine une tuile par cellule NON grattée. Grille fine
// (N=14) pour un rendu peu pixelisé. Mémoïsé : seule la case active se redessine.
//
// Props :
//   symboleEmoji (string)  emoji à révéler
//   touchees     (Set)     indices de cellules grattées (grille N×N)
//   revele       (bool)    case révélée (plus d'argent + pop + confettis)
//   version      (number)  change quand on gratte → déclenche le re-rendu (mémo)

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

const N = 14; // grille (doit correspondre à TicketGratter)

// --- Un éclat de confetti ---
function ConfettiDot({ boom, angle, couleur }) {
  const style = useAnimatedStyle(() => ({
    opacity: 1 - boom.value,
    transform: [
      { translateX: Math.cos(angle) * 46 * boom.value },
      { translateY: Math.sin(angle) * 46 * boom.value },
      { scale: 0.5 + boom.value * 0.8 },
    ],
  }));
  return <Animated.View style={[styles.confetti, { backgroundColor: couleur }, style]} />;
}

function ConfettiBurst({ trigger }) {
  const boom = useSharedValue(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    boom.value = 0;
    boom.value = withTiming(1, { duration: 650 });
    const t = setTimeout(() => setVisible(false), 720);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!visible) return null;
  const cols = ['#FFD700', '#EC4899', '#34D399', '#3DD6E8', '#FF9F45', '#A855F7', '#ffffff', '#FFD24A'];
  return (
    <View style={[StyleSheet.absoluteFill, styles.centre]} pointerEvents="none">
      {cols.map((c, i) => (
        <ConfettiDot key={i} boom={boom} angle={(i / cols.length) * Math.PI * 2} couleur={c} />
      ))}
    </View>
  );
}

function CaseGratter({ symboleEmoji, touchees, revele = false }) {
  const [dim, setDim] = useState({ w: 1, h: 1 });
  const echelle = useSharedValue(1);
  const dejaPop = useRef(false);

  useEffect(() => {
    if (revele && !dejaPop.current) {
      dejaPop.current = true;
      echelle.value = withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(1.25, { duration: 160 }),
        withTiming(1, { duration: 140 }),
      );
    }
  }, [revele]);

  const styleEmoji = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));

  // Tuiles argentées : une par cellule encore non grattée.
  const cellW = dim.w / N;
  const cellH = dim.h / N;
  const tuiles = [];
  if (!revele) {
    for (let idx = 0; idx < N * N; idx++) {
      if (touchees && touchees.has(idx)) continue;
      const c = idx % N;
      const r = Math.floor(idx / N);
      tuiles.push(<Rect key={idx} x={c * cellW} y={r * cellH} width={cellW + 0.7} height={cellH + 0.7} fill="#cfcfd8" />);
    }
  }

  return (
    <View
      style={styles.case}
      onLayout={(e) => setDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      pointerEvents="none"
    >
      <Animated.View style={[styles.emoji, styleEmoji]} pointerEvents="none">
        <Text style={[styles.emojiTexte, { fontSize: Math.min(dim.w, dim.h) * 0.52 }]}>{symboleEmoji}</Text>
      </Animated.View>

      {!revele && (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          {tuiles}
        </Svg>
      )}

      <ConfettiBurst trigger={revele} />
    </View>
  );
}

// Mémoïsé : ne re-rend que si symbole/revele/version changent (version = taille du Set gratté).
export default React.memo(CaseGratter, (a, b) =>
  a.symboleEmoji === b.symboleEmoji && a.revele === b.revele && a.version === b.version
);

const styles = StyleSheet.create({
  case: {
    width: '100%',
    aspectRatio: 0.74,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emoji: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  emojiTexte: { textAlign: 'center' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  confetti: { position: 'absolute', width: 8, height: 8, borderRadius: 2 },
});
