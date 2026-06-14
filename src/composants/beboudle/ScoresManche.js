// src/composants/beboudle/ScoresManche.js
// Overlay de fin de manche : révèle la bonne réponse + le combo, puis le classement.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COULEURS } from '../../theme/couleurs';
import { POLICES } from '../../theme/styles';

export default function ScoresManche({ bonneReponse, scores = [], monId }) {
  if (!bonneReponse) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay} pointerEvents="none">
      <Animated.View entering={FadeInDown.springify()} style={styles.carte}>
        <Text style={styles.label}>La réponse était</Text>
        <Text style={styles.nom}>{bonneReponse.nom}</Text>
        <Text style={styles.combo}>{(bonneReponse.combo || []).join('  ')}</Text>

        <View style={styles.sep} />

        {scores.map((j, i) => {
          const moi = j.id === monId;
          return (
            <View key={j.id} style={[styles.ligne, moi && styles.ligneMoi]}>
              <Text style={[styles.rang, i === 0 && styles.rangOr]}>{i + 1}</Text>
              <Text style={[styles.pseudo, moi && styles.pseudoMoi]} numberOfLines={1}>{j.pseudo}</Text>
              <Text style={[styles.points, i === 0 && styles.rangOr]}>{j.points}</Text>
            </View>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,10,34,0.72)',
    zIndex: 40,
    padding: 22,
  },
  carte: {
    width: '100%',
    backgroundColor: 'rgba(43,27,71,0.95)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.45)',
    padding: 20,
    alignItems: 'center',
  },
  label: { fontFamily: POLICES.texte, fontSize: 14, color: COULEURS.texteDoux },
  nom: { fontFamily: POLICES.titre, fontSize: 30, color: COULEURS.jaune, textAlign: 'center', marginTop: 2 },
  combo: { fontSize: 32, marginTop: 8, letterSpacing: 2 },
  sep: { height: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14 },
  ligne: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingVertical: 6, gap: 12 },
  ligneMoi: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 8 },
  rang: { fontFamily: POLICES.titreMoyen, fontSize: 16, color: COULEURS.blanc, width: 22, textAlign: 'center' },
  rangOr: { color: COULEURS.jaune },
  pseudo: { flex: 1, fontFamily: POLICES.texteGras, fontSize: 16, color: COULEURS.blanc },
  pseudoMoi: { color: COULEURS.jaune },
  points: { fontFamily: POLICES.titreMoyen, fontSize: 16, color: COULEURS.blanc, minWidth: 56, textAlign: 'right' },
});
