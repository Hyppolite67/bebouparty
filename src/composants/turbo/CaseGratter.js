// src/composants/turbo/CaseGratter.js
// Une case à gratter — composant PASSIF (pas de tactile ici).
// Le grattage est capté par TicketGratter (une SEULE zone englobant les 3 cases),
// qui transmet à chaque case le chemin gratté (`chemin`) et l'état révélé (`revele`).
//
//   - L'emoji est affiché DERRIÈRE, dans un <Text> RN (rendu emoji fiable).
//   - Une couche « argent » (Svg) le recouvre, creusée par le masque `chemin`.
//   - À la révélation, l'emoji fait un petit POP (scale 0.6 → 1.25 → 1).
//
// Props :
//   symboleEmoji (string)  emoji à révéler
//   chemin       (string)  attribut "d" du tracé gratté (coords locales à la case)
//   revele       (bool)    case révélée (couche argent retirée + pop)
//   id           (string)  id UNIQUE du masque SVG ('m-0', 'm-1', 'm-2')

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Defs, Mask, Rect, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

// Épaisseur du trait de grattage (fraction de la largeur de la case).
const FRACTION_TRAIT = 0.24;

export default function CaseGratter({ symboleEmoji, chemin = '', revele = false, id = 'm-case' }) {
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
  const epaisseur = Math.max(22, dim.w * FRACTION_TRAIT);

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

      {/* Couche argent + masque creusé par le grattage (retirée une fois révélée) */}
      {!revele && (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Mask id={id}>
              <Rect x="0" y="0" width="100%" height="100%" fill="white" />
              {chemin ? (
                <Path d={chemin} stroke="black" strokeWidth={epaisseur} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
            </Mask>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="#cfcfd8" mask={`url(#${id})`} />
          <Rect x="0" y="0" width="42%" height="100%" fill="rgba(255,255,255,0.28)" mask={`url(#${id})`} />
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
