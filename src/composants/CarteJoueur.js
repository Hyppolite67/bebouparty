// src/composants/CarteJoueur.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Mascotte from './Mascotte';
import CarteGlass from './CarteGlass';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function CarteJoueur({ joueur }) {
  return (
    <CarteGlass style={styles.carte}>
      <Mascotte config={joueur.mascotte} taille={54} anime={false} />
      <Text style={styles.pseudo} numberOfLines={1}>{joueur.pseudo}</Text>
      {joueur.estHote && <Text style={styles.hote}>👑 Hôte</Text>}
    </CarteGlass>
  );
}

const styles = StyleSheet.create({
  carte: { alignItems: 'center', padding: 10, width: 100 },
  pseudo: { fontFamily: POLICES.texteGras, fontSize: 14, color: COULEURS.blanc, marginTop: 4 },
  hote: { fontFamily: POLICES.texte, fontSize: 11, color: COULEURS.jaune },
});
