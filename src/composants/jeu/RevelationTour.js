// src/composants/jeu/RevelationTour.js
// Overlay affiché en fin de tour pour révéler le mot secret à tous.
// Se ferme automatiquement quand le serveur enchaîne (événement `preparation`),
// ce qui efface `mot` dans l'écran parent — pas besoin de timer ici.
// Props :
//   mot : string — le mot révélé (null = invisible)
import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { COULEURS } from '../../theme/couleurs';
import { POLICES, RAYONS } from '../../theme/styles';

export default function RevelationTour({ mot }) {
  if (!mot) return null;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.fond}>
        <View style={styles.panneau}>
          {/* Emoji décoratif */}
          <Text style={styles.emoji}>🎨</Text>

          {/* Message principal */}
          <Text style={styles.libelle}>Le mot était :</Text>
          <Text style={styles.mot}>{mot}</Text>

          {/* Indication de transition */}
          <Text style={styles.attente}>Prochain tour dans un instant…</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    backgroundColor: 'rgba(30,15,55,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  panneau: {
    width: '100%',
    backgroundColor: 'rgba(43,27,71,0.97)',
    borderRadius: RAYONS.carte,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },

  emoji: {
    fontSize: 56,
    marginBottom: 4,
  },

  libelle: {
    fontFamily: POLICES.texte,
    fontSize: 18,
    color: COULEURS.texteDoux,
  },

  mot: {
    fontFamily: POLICES.titre,
    fontSize: 36,
    color: COULEURS.jaune,
    textTransform: 'capitalize',
    textAlign: 'center',
  },

  attente: {
    fontFamily: POLICES.texte,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 8,
  },
});
