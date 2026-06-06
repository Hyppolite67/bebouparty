// src/composants/BoutonPrincipal.js
import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COULEURS } from '../theme/couleurs';
import { RAYONS, ombreColoree, POLICES } from '../theme/styles';

// couleur = couleur vive du bouton ; ombre = couleur de l'ombre portée
export default function BoutonPrincipal({ titre, sousTitre, icone, couleur, ombre, onPress, desactive }) {
  const echelle = useSharedValue(1);
  const styleAnim = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));

  return (
    <Animated.View style={[styleAnim, ombreColoree(ombre || couleur), { opacity: desactive ? 0.5 : 1 }]}>
      <Pressable
        disabled={desactive}
        onPressIn={() => (echelle.value = withSpring(0.96))}
        onPressOut={() => (echelle.value = withSpring(1))}
        onPress={onPress}
        style={[styles.bouton, { backgroundColor: couleur }]}
      >
        {icone ? <Text style={styles.icone}>{icone}</Text> : null}
        <Text style={styles.titre}>{titre}</Text>
        {sousTitre ? <Text style={styles.sousTitre}>{sousTitre}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bouton: { borderRadius: RAYONS.bouton, paddingVertical: 18, paddingHorizontal: 22, alignItems: 'center' },
  icone: { fontSize: 26, marginBottom: 4 },
  titre: { fontFamily: POLICES.texteGras, fontSize: 20, color: COULEURS.blanc },
  sousTitre: { fontFamily: POLICES.texte, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});
