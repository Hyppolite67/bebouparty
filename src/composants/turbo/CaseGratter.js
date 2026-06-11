// src/composants/turbo/CaseGratter.js
// Une case à gratter — composant PASSIF (le tactile est géré par TicketGratter).
//
// TECHNIQUE SANS <Mask> (plus de crash natif possible) :
//   - L'emoji est affiché DERRIÈRE (Text RN), avec un POP à la révélation.
//   - La couche « argent » est une GRILLE de petites tuiles : on dessine une
//     tuile pour chaque cellule NON grattée. Les cellules grattées (Set `touchees`)
//     ne sont pas dessinées → l'emoji apparaît dessous, comme un vrai ticket.
//
// Props :
//   symboleEmoji (string)  emoji à révéler
//   touchees     (Set)     indices de cellules grattées (grille N×N)
//   revele       (bool)    case révélée (plus d'argent + pop)

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

const N = 8; // grille 8×8 (doit correspondre à TicketGratter)

export default function CaseGratter({ symboleEmoji, touchees, revele = false }) {
  const [dim, setDim] = useState({ w: 1, h: 1 });
  const echelle = useSharedValue(1);
  const dejaPop = useRef(false);

  // POP à la révélation
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

  // Tuiles argentées : une par cellule encore NON grattée.
  const cellW = dim.w / N;
  const cellH = dim.h / N;
  const tuiles = [];
  if (!revele) {
    for (let idx = 0; idx < N * N; idx++) {
      if (touchees && touchees.has(idx)) continue;
      const c = idx % N;
      const r = Math.floor(idx / N);
      tuiles.push(
        <Rect key={idx} x={c * cellW} y={r * cellH} width={cellW + 0.6} height={cellH + 0.6} fill="#cfcfd8" />
      );
    }
  }

  return (
    <View
      style={styles.case}
      onLayout={(e) => setDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      pointerEvents="none"
    >
      {/* Emoji (derrière), avec POP à la révélation */}
      <Animated.View style={[styles.emoji, styleEmoji]} pointerEvents="none">
        <Text style={[styles.emojiTexte, { fontSize: Math.min(dim.w, dim.h) * 0.52 }]}>{symboleEmoji}</Text>
      </Animated.View>

      {/* Couche argent en tuiles (sans masque) */}
      {!revele && (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          {tuiles}
        </Svg>
      )}
    </View>
  );
}

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
});
