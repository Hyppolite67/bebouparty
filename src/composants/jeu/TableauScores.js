// src/composants/jeu/TableauScores.js
// Bande horizontale des joueurs avec pseudo, points, état (trouvé / dessinateur / moi).
// Props :
//   joueurs       : [{ id, pseudo, mascotte, points }]
//   dessinateurId : id du dessinateur actuel
//   ontTrouve     : Set d'ids des joueurs ayant trouvé ce tour
//   monId         : mon propre id (pour me mettre en valeur)
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Mascotte from '../Mascotte';
import { COULEURS } from '../../theme/couleurs';
import { POLICES, RAYONS } from '../../theme/styles';

export default function TableauScores({ joueurs, dessinateurId, ontTrouve, monId }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.conteneur}
    >
      {(joueurs || []).map((joueur) => {
        const estDessinateur = joueur.id === dessinateurId;
        const aTrouve = ontTrouve && ontTrouve.has(joueur.id);
        const estMoi = joueur.id === monId;

        return (
          <View
            key={joueur.id}
            style={[
              styles.carte,
              estMoi && styles.carteMoi,
              aTrouve && styles.carteTrouve,
              estDessinateur && styles.carteDessinateur,
            ]}
          >
            {/* Mascotte miniature */}
            <View style={styles.mascotteZone}>
              <Mascotte
                config={joueur.mascotte}
                taille={36}
                anime={false}
              />
              {/* Badge d'état au-dessus de la mascotte */}
              {estDessinateur && (
                <Text style={styles.badgeDessinateur}>✏️</Text>
              )}
              {aTrouve && !estDessinateur && (
                <Text style={styles.badgeTrouve}>✓</Text>
              )}
            </View>

            {/* Pseudo (tronqué à 8 chars) */}
            <Text style={[styles.pseudo, estMoi && styles.pseudoMoi]} numberOfLines={1}>
              {joueur.pseudo || '?'}
            </Text>

            {/* Points */}
            <Text style={styles.points}>
              {joueur.points || 0}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'stretch',
  },

  carte: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: RAYONS.petit,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
    gap: 2,
  },
  carteMoi: {
    borderColor: COULEURS.jaune,
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  carteTrouve: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  carteDessinateur: {
    borderColor: COULEURS.cyan,
    backgroundColor: 'rgba(6,182,212,0.12)',
  },

  mascotteZone: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeDessinateur: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 12,
  },
  badgeTrouve: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 12,
    color: '#22C55E',
    fontFamily: POLICES.texteGras,
  },

  pseudo: {
    fontFamily: POLICES.texte,
    fontSize: 11,
    color: COULEURS.texteDoux,
    maxWidth: 70,
    textAlign: 'center',
  },
  pseudoMoi: {
    color: COULEURS.jaune,
    fontFamily: POLICES.texteGras,
  },

  points: {
    fontFamily: POLICES.texteGras,
    fontSize: 13,
    color: COULEURS.blanc,
  },
});
