// src/composants/CarteGlass.js
// Panneau translucide (glassmorphism) réutilisable.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COULEURS } from '../theme/couleurs';
import { RAYONS } from '../theme/styles';

export default function CarteGlass({ children, style }) {
  return <View style={[styles.carte, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: COULEURS.verre,
    borderColor: COULEURS.verreBordure,
    borderWidth: 1.5,
    borderRadius: RAYONS.carte,
    padding: 18,
  },
});
