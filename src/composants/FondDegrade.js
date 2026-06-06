// src/composants/FondDegrade.js
// Fond réutilisé par TOUS les écrans : dégradé violet->rose + confettis animés.
import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { DEGRADE_FOND } from '../theme/couleurs';

const { height } = Dimensions.get('window');
const EMOJIS = ['⭐', '✨', '🎉', '🍬', '🎈'];

// Un confetti qui tombe en boucle
function Confetti({ gauche, emoji, duree, delai }) {
  const y = useSharedValue(-40);
  useEffect(() => {
    y.value = withRepeat(withTiming(height + 40, { duration: duree, easing: Easing.linear }), -1);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.Text style={[styles.confetti, { left: gauche }, style]}>{emoji}</Animated.Text>
  );
}

export default function FondDegrade({ children }) {
  return (
    <LinearGradient colors={DEGRADE_FOND} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.fond}>
      {/* Quelques confettis décoratifs */}
      {[...Array(6)].map((_, i) => (
        <Confetti key={i} gauche={`${8 + i * 15}%`} emoji={EMOJIS[i % EMOJIS.length]} duree={6000 + i * 800} delai={i * 500} />
      ))}
      <SafeAreaView style={styles.contenu}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  contenu: { flex: 1, paddingHorizontal: 22 },
  confetti: { position: 'absolute', top: 0, fontSize: 18, opacity: 0.8 },
});
