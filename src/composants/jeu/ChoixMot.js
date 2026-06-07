// src/composants/jeu/ChoixMot.js
// Overlay affiché au dessinateur pour choisir parmi 3 mots proposés par le serveur.
// Props :
//   mots      : string[] — les 3 mots proposés
//   onChoisir : (mot: string) => void — appelé quand le joueur appuie sur un mot
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { COULEURS } from '../../theme/couleurs';
import { POLICES, RAYONS, ombreColoree } from '../../theme/styles';

export default function ChoixMot({ mots, onChoisir }) {
  if (!mots || mots.length === 0) return null;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      {/* Fond semi-opaque */}
      <View style={styles.fond}>
        <View style={styles.panneau}>
          {/* Titre */}
          <Text style={styles.titre}>✏️ Choisis un mot à dessiner !</Text>
          <Text style={styles.sousTitre}>Les autres joueurs devront le deviner.</Text>

          {/* Les 3 boutons-mots */}
          <View style={styles.listeMots}>
            {mots.map((mot, index) => (
              <TouchableOpacity
                key={mot}
                onPress={() => onChoisir(mot)}
                style={[styles.boutonMot, ombreColoree(COULEURS_BOUTONS[index % 3])]}
                activeOpacity={0.82}
              >
                <Text style={styles.texteMot}>{mot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Couleurs distinctes pour les 3 boutons
const COULEURS_BOUTONS = [COULEURS.violet, '#FF9F45', COULEURS.cyan];

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    backgroundColor: 'rgba(30,15,55,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  panneau: {
    width: '100%',
    backgroundColor: 'rgba(43,27,71,0.96)',
    borderRadius: RAYONS.carte,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    padding: 24,
    gap: 20,
    alignItems: 'center',
  },

  titre: {
    fontFamily: POLICES.titre,
    fontSize: 22,
    color: COULEURS.jaune,
    textAlign: 'center',
  },
  sousTitre: {
    fontFamily: POLICES.texte,
    fontSize: 14,
    color: COULEURS.texteDoux,
    textAlign: 'center',
    marginTop: -12,
  },

  listeMots: {
    width: '100%',
    gap: 12,
  },

  boutonMot: {
    width: '100%',
    backgroundColor: COULEURS.violet,
    borderRadius: RAYONS.bouton,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.30)',
  },

  texteMot: {
    fontFamily: POLICES.texteGras,
    fontSize: 22,
    color: COULEURS.blanc,
    letterSpacing: 1,
    textTransform: 'capitalize',
  },
});
