// src/ecrans/EcranPodium.js
// Écran de classement final après la partie.
// Reçoit `route.params.classement` : [{ id, pseudo, mascotte?, points }] (déjà trié côté serveur).
// Top 3 mis en avant avec médailles, puis le reste.
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import Mascotte from '../composants/Mascotte';
import { COULEURS } from '../theme/couleurs';
import { POLICES, RAYONS, ombreColoree } from '../theme/styles';
import * as Reseau from '../reseau/ClientReseau';

// Médailles pour le top 3
const MEDAILLES = ['🥇', '🥈', '🥉'];
// Couleurs de mise en avant pour le top 3
const COULEURS_PODIUM = [COULEURS.jaune, '#C0C0C0', '#CD7F32'];

// Carte d'un joueur sur le podium (top 3, grande)
function CarteTop({ joueur, rang }) {
  const medaille = MEDAILLES[rang];
  const couleurAccent = COULEURS_PODIUM[rang];

  return (
    <View style={[styles.carteTop, { borderColor: couleurAccent }]}>
      {/* Médaille */}
      <Text style={styles.medaille}>{medaille}</Text>

      {/* Mascotte */}
      <View style={styles.mascotteTop}>
        <Mascotte config={joueur.mascotte} taille={72} anime={rang === 0} />
      </View>

      {/* Pseudo */}
      <Text style={[styles.pseudoTop, { color: couleurAccent }]} numberOfLines={1}>
        {joueur.pseudo}
      </Text>

      {/* Points */}
      <Text style={styles.pointsTop}>{joueur.points} pts</Text>
    </View>
  );
}

// Ligne d'un joueur hors top 3
function LigneJoueur({ joueur, rang }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.rangLigne}>#{rang + 1}</Text>
      <View style={styles.mascotteLigne}>
        <Mascotte config={joueur.mascotte} taille={32} anime={false} />
      </View>
      <Text style={styles.pseudoLigne} numberOfLines={1}>{joueur.pseudo}</Text>
      <Text style={styles.pointsLigne}>{joueur.points} pts</Text>
    </View>
  );
}

export default function EcranPodium({ route, navigation }) {
  const classement = route?.params?.classement || [];
  const top3 = classement.slice(0, 3);
  const reste = classement.slice(3);

  const retourAccueil = () => {
    Reseau.quitter();
    navigation.popToTop();
  };

  return (
    <FondDegrade>
      <View style={styles.conteneur}>
        {/* Titre */}
        <Text style={styles.titre}>🏆 Classement final !</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Top 3 — disposition en V (2e | 1er | 3e) */}
          {top3.length > 0 && (
            <View style={styles.podium}>
              {/* 2e place à gauche */}
              {top3[1] ? (
                <View style={[styles.socleV, styles.socle2]}>
                  <CarteTop joueur={top3[1]} rang={1} />
                </View>
              ) : <View style={styles.socleVide} />}

              {/* 1er au centre, légèrement plus haut */}
              <View style={[styles.socleV, styles.socle1]}>
                <CarteTop joueur={top3[0]} rang={0} />
              </View>

              {/* 3e place à droite */}
              {top3[2] ? (
                <View style={[styles.socleV, styles.socle3]}>
                  <CarteTop joueur={top3[2]} rang={2} />
                </View>
              ) : <View style={styles.socleVide} />}
            </View>
          )}

          {/* Rang 4+ */}
          {reste.length > 0 && (
            <View style={styles.listeReste}>
              {reste.map((j, i) => (
                <LigneJoueur key={j.id} joueur={j} rang={i + 3} />
              ))}
            </View>
          )}

          {/* Cas liste vide (ne devrait pas arriver) */}
          {classement.length === 0 && (
            <Text style={styles.vide}>Aucun score disponible.</Text>
          )}
        </ScrollView>

        {/* Bouton retour */}
        <TouchableOpacity
          onPress={retourAccueil}
          style={[styles.boutonRetour, ombreColoree(COULEURS.violet)]}
          activeOpacity={0.82}
        >
          <Text style={styles.texteRetour}>🏠 Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    gap: 12,
  },

  titre: {
    fontFamily: POLICES.titre,
    fontSize: 28,
    color: COULEURS.jaune,
    textAlign: 'center',
    marginTop: 8,
  },

  scroll: {
    gap: 16,
    paddingBottom: 8,
  },

  // Podium en V : 2e | 1er | 3e
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  socleV: {
    flex: 1,
    alignItems: 'center',
  },
  socleVide: {
    flex: 1,
  },
  socle1: {
    // 1er légèrement plus haut (margin négative)
    marginBottom: 12,
  },
  socle2: {
    // 2e légèrement décalé
    marginBottom: 4,
  },
  socle3: {},

  // Carte top 3
  carteTop: {
    alignItems: 'center',
    backgroundColor: 'rgba(43,27,71,0.60)',
    borderRadius: RAYONS.carte,
    borderWidth: 2.5,
    padding: 10,
    gap: 4,
    width: '100%',
  },
  medaille: {
    fontSize: 28,
  },
  mascotteTop: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pseudoTop: {
    fontFamily: POLICES.texteGras,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '100%',
  },
  pointsTop: {
    fontFamily: POLICES.texteGras,
    fontSize: 16,
    color: COULEURS.blanc,
  },

  // Lignes rang 4+
  listeReste: {
    backgroundColor: 'rgba(43,27,71,0.50)',
    borderRadius: RAYONS.carte,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
    gap: 0,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  rangLigne: {
    fontFamily: POLICES.texteGras,
    fontSize: 14,
    color: COULEURS.texteDoux,
    width: 28,
  },
  mascotteLigne: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pseudoLigne: {
    flex: 1,
    fontFamily: POLICES.texte,
    fontSize: 15,
    color: COULEURS.blanc,
  },
  pointsLigne: {
    fontFamily: POLICES.texteGras,
    fontSize: 14,
    color: COULEURS.jaune,
  },

  // Cas vide
  vide: {
    fontFamily: POLICES.texte,
    fontSize: 15,
    color: COULEURS.texteDoux,
    textAlign: 'center',
    marginTop: 32,
  },

  // Bouton retour
  boutonRetour: {
    backgroundColor: COULEURS.violet,
    borderRadius: RAYONS.bouton,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  texteRetour: {
    fontFamily: POLICES.texteGras,
    fontSize: 18,
    color: COULEURS.blanc,
  },
});
