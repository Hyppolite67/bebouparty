// src/composants/beboudle/BoutonPersonne.js
// Un bouton prénom de Beboudle. États : 'normal' | 'choisi' | 'bon' | 'mauvais'.
import React, { useEffect } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { COULEURS } from '../../theme/couleurs';
import { POLICES } from '../../theme/styles';

export default function BoutonPersonne({ nom, etat = 'normal', gain, onPress, disabled }) {
  const tremble = useSharedValue(0);

  // Petit shake quand le bouton devient « mauvais ».
  useEffect(() => {
    if (etat === 'mauvais') {
      tremble.value = withSequence(
        withTiming(-5, { duration: 60 }), withTiming(5, { duration: 60 }),
        withTiming(-4, { duration: 60 }), withTiming(0, { duration: 60 }),
      );
    }
  }, [etat]);
  const styleTremble = useAnimatedStyle(() => ({ transform: [{ translateX: tremble.value }] }));

  const styleEtat =
    etat === 'choisi' ? styles.choisi :
    etat === 'bon' ? styles.bon :
    etat === 'mauvais' ? styles.mauvais : styles.normal;

  return (
    <Animated.View style={[styles.wrap, styleTremble]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.btn, styleEtat]}
      >
        {gain != null && etat === 'bon' && <Text style={styles.gain}>+{gain} pts</Text>}
        {etat === 'bon' && <Text style={styles.badge}>✅</Text>}
        {etat === 'mauvais' && <Text style={styles.badge}>❌</Text>}
        <Text style={styles.nom} numberOfLines={2}>{nom}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  btn: {
    flex: 1,
    minHeight: 64,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  nom: { fontFamily: POLICES.texteGras, fontSize: 16, color: COULEURS.blanc, textAlign: 'center' },
  normal: { backgroundColor: 'rgba(123,47,190,0.45)', borderColor: 'rgba(255,255,255,0.22)' },
  choisi: { backgroundColor: COULEURS.violet, borderColor: '#fff' },
  bon: { backgroundColor: '#16A34A', borderColor: '#BBF7D0' },
  mauvais: { backgroundColor: '#DC2626', borderColor: '#FCA5A5' },
  badge: { position: 'absolute', top: -10, right: -6, fontSize: 16 },
  gain: { position: 'absolute', top: -14, fontFamily: POLICES.titreMoyen, fontSize: 13, color: COULEURS.jaune },
});
