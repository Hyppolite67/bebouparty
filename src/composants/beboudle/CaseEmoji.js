// src/composants/beboudle/CaseEmoji.js
// Une case emoji de Beboudle. Emoji en TEXTE natif (pas de lib).
// - revele=false → fond glass sombre + « ? » qui pulse doucement.
// - revele=true  → emoji avec pop spectaculaire + flash + petites particules.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat,
} from 'react-native-reanimated';
import { COULEURS } from '../../theme/couleurs';
import { POLICES } from '../../theme/styles';

const COULEURS_PARTICULES = ['#FFD700', '#EC4899', '#34D399', '#3DD6E8', '#A855F7', '#fff'];

function Particule({ boom, angle, couleur }) {
  const style = useAnimatedStyle(() => ({
    opacity: 1 - boom.value,
    transform: [
      { translateX: Math.cos(angle) * 42 * boom.value },
      { translateY: Math.sin(angle) * 42 * boom.value },
      { scale: 0.4 + boom.value * 0.7 },
    ],
  }));
  return <Animated.View style={[styles.particule, { backgroundColor: couleur }, style]} />;
}

function Explosion({ trigger }) {
  const boom = useSharedValue(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    boom.value = 0;
    boom.value = withTiming(1, { duration: 620 });
    const t = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.centre]} pointerEvents="none">
      {COULEURS_PARTICULES.map((c, i) => (
        <Particule key={i} boom={boom} angle={(i / COULEURS_PARTICULES.length) * Math.PI * 2} couleur={c} />
      ))}
    </View>
  );
}

function CaseEmoji({ emoji, revele = false, numero }) {
  const echelle = useSharedValue(1);
  const lueur = useSharedValue(0);
  const pulse = useSharedValue(1);
  const dejaPop = useRef(false);

  // Pop + flash à la première révélation.
  useEffect(() => {
    if (revele && !dejaPop.current) {
      dejaPop.current = true;
      echelle.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.3, { duration: 180 }),
        withTiming(1, { duration: 150 }),
      );
      lueur.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 420 }));
    }
  }, [revele]);

  // Pulsation douce du « ? » tant que non révélé.
  useEffect(() => {
    if (!revele) {
      pulse.value = withRepeat(withSequence(
        withTiming(1.12, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ), -1, false);
    }
  }, [revele]);

  const styleEmoji = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  const styleQ = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 0.55 + (pulse.value - 1) * 3 }));
  const styleFlash = useAnimatedStyle(() => ({ opacity: lueur.value }));

  return (
    <View style={[styles.case, revele ? styles.caseRevelee : styles.caseCachee]}>
      {numero != null && <Text style={styles.numero}>{numero}</Text>}

      {revele ? (
        <Animated.Text style={[styles.emoji, styleEmoji]}>{emoji}</Animated.Text>
      ) : (
        <Animated.Text style={[styles.q, styleQ]}>?</Animated.Text>
      )}

      {/* Flash lumineux bref par-dessus la case */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, styleFlash]} />
      <Explosion trigger={revele} />
    </View>
  );
}

export default React.memo(CaseEmoji, (a, b) => a.emoji === b.emoji && a.revele === b.revele && a.numero === b.numero);

const styles = StyleSheet.create({
  case: {
    flex: 1,
    aspectRatio: 0.82,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
  },
  caseCachee: {
    backgroundColor: 'rgba(20,10,40,0.34)',
    borderColor: 'rgba(255,255,255,0.30)',
    borderStyle: 'dashed',
  },
  caseRevelee: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderColor: 'rgba(255,255,255,0.55)',
  },
  numero: { position: 'absolute', top: 5, left: 8, fontSize: 10, fontFamily: POLICES.texte, color: 'rgba(255,255,255,0.6)' },
  emoji: { fontSize: 42, textAlign: 'center' },
  q: { fontFamily: POLICES.titre, fontSize: 46, color: 'rgba(255,255,255,0.7)' },
  flash: { backgroundColor: '#ffffff' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  particule: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
});
