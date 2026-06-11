// src/composants/turbo/FilDirect.js
// Le fil « EN DIRECT » : une seule ligne compacte.
// Props :
//   message {string}  — texte du dernier événement
//   ton     {string}  — 'vert' | 'rouge' | 'bleu' | 'dore' | (rien = blanc)
// Petit fondu à chaque changement de message. Point rouge clignotant.

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { POLICES } from '../../theme/styles';

// Couleurs du texte selon le ton
const COULEURS_TEXTE = {
  vert: '#9DE8B6',
  rouge: '#FCA5A5',
  bleu: '#93C5FD',
  dore: '#FDE68A',
};

export default function FilDirect({ message = '', ton = '' }) {
  // Fondu à chaque changement de message
  const opaciteMessage = useSharedValue(0);

  // Point rouge clignotant (en parallèle, indépendant du message)
  const opacitePoint = useSharedValue(1);

  useEffect(() => {
    // Clignottement continu du point live
    opacitePoint.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.2, { duration: 500 }),
      ),
      -1, // infini
      false,
    );
  }, []);

  useEffect(() => {
    if (!message) return;
    // Fondu entrant à chaque nouveau message
    opaciteMessage.value = 0;
    opaciteMessage.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [message]);

  const stylePoint = useAnimatedStyle(() => ({
    opacity: opacitePoint.value,
  }));

  const styleMessage = useAnimatedStyle(() => ({
    opacity: opaciteMessage.value,
  }));

  const couleurTexte = COULEURS_TEXTE[ton] || 'rgba(255,255,255,0.9)';

  return (
    <View style={styles.conteneur}>
      {/* Point rouge « live » clignotant */}
      <Animated.View style={[styles.pointLive, stylePoint]} />

      {/* Message avec fondu */}
      <Animated.Text
        style={[styles.message, { color: couleurTexte }, styleMessage]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {message}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.34)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 11,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pointLive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    // Ombre rouge
    shadowColor: '#EF4444',
    shadowRadius: 4,
    shadowOpacity: 0.8,
    elevation: 3,
    flexShrink: 0,
  },
  message: {
    fontFamily: POLICES.texte,
    fontSize: 11.5,
    lineHeight: 15,
    flex: 1,
  },
});
