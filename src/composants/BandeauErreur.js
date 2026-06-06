// src/composants/BandeauErreur.js
// Bandeau rouge affiché en superposition quand la connexion au serveur est perdue.
// Reçoit onReessayer : fonction appelée quand l'utilisateur appuie sur « Réessayer ».
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function BandeauErreur({ onReessayer }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // S'abonner à l'événement 'deconnecte' émis par ClientReseau
    const off = Reseau.sur('deconnecte', () => setVisible(true));
    return off; // désabonnement au démontage du composant
  }, []);
  if (!visible) return null;
  return (
    <View style={styles.bandeau}>
      <Text style={styles.txt}>Connexion au serveur perdue 😕</Text>
      {onReessayer && (
        <Pressable onPress={onReessayer}>
          <Text style={styles.lien}>Réessayer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Position absolue : le bandeau se superpose au contenu sans le déplacer
  bandeau: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: COULEURS.erreur,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    zIndex: 100,
  },
  txt: { fontFamily: POLICES.texteGras, color: COULEURS.blanc, fontSize: 14 },
  lien: { fontFamily: POLICES.texteGras, color: COULEURS.jaune, fontSize: 14, marginTop: 4 },
});
