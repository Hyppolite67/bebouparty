// src/ecrans/EcranJeuDessin.js
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function EcranJeuDessin() {
  return (
    <FondDegrade>
      <View style={styles.c}>
        <Text style={styles.emoji}>🖌️</Text>
        <Text style={styles.titre}>Devine le dessin</Text>
        <Text style={styles.txt}>Ce mini-jeu arrive bientôt !</Text>
      </View>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji: { fontSize: 64 },
  titre: { fontFamily: POLICES.titre, fontSize: 30, color: COULEURS.jaune },
  txt: { fontFamily: POLICES.texte, fontSize: 16, color: COULEURS.blanc },
});
