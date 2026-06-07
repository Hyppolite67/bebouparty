// src/composants/jeu/ChronoBar.js
// Barre de progression + compte à rebours LOCAL.
// Purement visuel : le serveur décide la vraie fin du tour.
// Props :
//   duree  : durée totale du tour en secondes (ex. 80)
//   debut  : instant de départ en ms (Date.now() au moment de tourDemarre)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COULEURS } from '../../theme/couleurs';
import { POLICES } from '../../theme/styles';

export default function ChronoBar({ duree, debut }) {
  // Secondes restantes calculées localement (~1s de précision)
  const [restant, setRestant] = useState(duree);

  useEffect(() => {
    if (!debut || !duree) return;

    // Calcul immédiat (au cas où le composant monte après un délai)
    const calculer = () => {
      const ecoule = (Date.now() - debut) / 1000;
      return Math.max(0, Math.round(duree - ecoule));
    };

    setRestant(calculer());

    const intervalle = setInterval(() => {
      const r = calculer();
      setRestant(r);
      if (r <= 0) clearInterval(intervalle);
    }, 500); // mise à jour toutes les 500 ms pour plus de fluidité

    return () => clearInterval(intervalle);
  }, [debut, duree]);

  // Ratio 0→1 pour la largeur de la barre
  const ratio = duree > 0 ? Math.max(0, Math.min(1, restant / duree)) : 0;

  // Couleur : vert → orange → rouge selon le temps restant
  const couleurBarre = ratio > 0.5
    ? COULEURS.violet          // > 50% → violet (neutre)
    : ratio > 0.25
      ? '#FF9F45'              // 25-50% → orange
      : COULEURS.erreur;       // < 25% → rouge

  return (
    <View style={styles.conteneur}>
      {/* Piste de fond */}
      <View style={styles.piste}>
        {/* Barre remplie */}
        <View style={[styles.barre, { width: `${ratio * 100}%`, backgroundColor: couleurBarre }]} />
      </View>
      {/* Affichage numérique */}
      <Text style={[styles.chiffre, restant <= 10 && styles.chiffreUrgent]}>
        {restant}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  piste: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  barre: {
    height: '100%',
    borderRadius: 5,
  },
  chiffre: {
    fontFamily: POLICES.texteGras,
    fontSize: 14,
    color: COULEURS.blanc,
    minWidth: 32,
    textAlign: 'right',
  },
  chiffreUrgent: {
    color: '#FF4444',
  },
});
