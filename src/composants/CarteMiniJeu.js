// src/composants/CarteMiniJeu.js
import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COULEURS } from '../theme/couleurs';
import { RAYONS, POLICES, ombreColoree } from '../theme/styles';

export default function CarteMiniJeu({ jeu, onPress }) {
  const echelle = useSharedValue(1);
  const styleAnim = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  const verrou = jeu.verrouille;
  return (
    <Animated.View style={[styleAnim, !verrou && ombreColoree(jeu.couleur), { flex: 1 }]}>
      <Pressable disabled={verrou}
        onPressIn={() => !verrou && (echelle.value = withSpring(0.95))}
        onPressOut={() => !verrou && (echelle.value = withSpring(1))}
        onPress={onPress}
        style={[styles.carte, { backgroundColor: verrou ? 'rgba(255,255,255,0.12)' : jeu.couleur, opacity: verrou ? 0.6 : 1 }]}>
        <Text style={styles.icone}>{verrou ? '🔒' : jeu.icone}</Text>
        <Text style={styles.nom}>{verrou ? 'Bientôt disponible' : jeu.nom}</Text>
        {!verrou && <Text style={styles.desc}>{jeu.description}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: RAYONS.carte, padding: 16, minHeight: 130, justifyContent: 'center', alignItems: 'center' },
  icone: { fontSize: 34, marginBottom: 6 },
  nom: { fontFamily: POLICES.titreMoyen, fontSize: 16, color: COULEURS.blanc, textAlign: 'center' },
  desc: { fontFamily: POLICES.texte, fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4 },
});
