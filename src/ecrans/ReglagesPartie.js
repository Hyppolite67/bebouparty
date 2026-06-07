// src/ecrans/ReglagesPartie.js
// Écran réservé à l'hôte : régler le nombre de manches et le temps par tour,
// puis lancer la partie. Les autres joueurs seront redirigés automatiquement
// vers JeuDessin quand le serveur renverra JEU_CHOISI (géré par EcranSelectionJeu).
import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteGlass from '../composants/CarteGlass';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES, RAYONS } from '../theme/styles';

// Options disponibles pour les réglages
const OPTIONS_MANCHES = [1, 2, 3];
const OPTIONS_DUREE = [60, 80, 100]; // en secondes

export default function ReglagesPartie({ navigation }) {
  const [manches, setManches] = useState(2);   // défaut : 2 manches
  const [duree, setDuree] = useState(80);       // défaut : 80 secondes

  const lancerPartie = () => {
    Reseau.choisirJeu('dessin', { manches, duree });
    // On navigue directement vers JeuDessin — pour les autres joueurs, la
    // redirection est déclenchée par l'événement jeuChoisi dans EcranSelectionJeu.
    navigation.replace('JeuDessin');
  };

  return (
    <FondDegrade>
      <ScrollView contentContainerStyle={styles.conteneur}>
        <Text style={styles.titre}>Réglages de la partie</Text>
        <Text style={styles.sousTitre}>Jeu : Devine le dessin 🖌️</Text>

        {/* Choix du nombre de manches */}
        <CarteGlass style={styles.carte}>
          <Text style={styles.labelSection}>Nombre de manches</Text>
          <Text style={styles.infoSection}>
            Chaque joueur dessine une fois par manche
          </Text>
          <View style={styles.groupeBoutons}>
            {OPTIONS_MANCHES.map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setManches(val)}
                style={[styles.boutonChoix, manches === val && styles.boutonChoixActif]}
              >
                <Text style={[styles.boutonChoixTexte, manches === val && styles.boutonChoixTexteActif]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </CarteGlass>

        {/* Choix du temps par tour */}
        <CarteGlass style={styles.carte}>
          <Text style={styles.labelSection}>Temps par tour</Text>
          <Text style={styles.infoSection}>
            Durée pour deviner le dessin
          </Text>
          <View style={styles.groupeBoutons}>
            {OPTIONS_DUREE.map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setDuree(val)}
                style={[styles.boutonChoix, duree === val && styles.boutonChoixActif]}
              >
                <Text style={[styles.boutonChoixTexte, duree === val && styles.boutonChoixTexteActif]}>
                  {val} s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </CarteGlass>

        {/* Récap des réglages sélectionnés */}
        <CarteGlass style={styles.carte}>
          <Text style={styles.recapLigne}>
            📊 {manches} manche{manches > 1 ? 's' : ''} · {duree} s par tour
          </Text>
        </CarteGlass>

        {/* Bouton de lancement */}
        <View style={styles.boutonLancer}>
          <BoutonPrincipal
            titre="Lancer la partie !"
            icone="🚀"
            couleur={COULEURS.rose}
            ombre={COULEURS.roseFonce}
            onPress={lancerPartie}
          />
        </View>
      </ScrollView>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  titre: {
    fontFamily: POLICES.titre,
    fontSize: 30,
    color: COULEURS.jaune,
    textAlign: 'center',
    marginBottom: 2,
  },
  sousTitre: {
    fontFamily: POLICES.texte,
    fontSize: 16,
    color: COULEURS.texteDoux,
    textAlign: 'center',
    marginBottom: 6,
  },
  carte: {
    gap: 10,
  },
  labelSection: {
    fontFamily: POLICES.titreMoyen,
    fontSize: 20,
    color: COULEURS.blanc,
  },
  infoSection: {
    fontFamily: POLICES.texte,
    fontSize: 13,
    color: COULEURS.texteDoux,
    marginTop: -4,
  },
  groupeBoutons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  boutonChoix: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RAYONS.bouton,
    alignItems: 'center',
    backgroundColor: COULEURS.verre,
    borderWidth: 1.5,
    borderColor: COULEURS.verreBordure,
  },
  boutonChoixActif: {
    backgroundColor: COULEURS.violet,
    borderColor: COULEURS.violet,
  },
  boutonChoixTexte: {
    fontFamily: POLICES.texteGras,
    fontSize: 18,
    color: COULEURS.texteDoux,
  },
  boutonChoixTexteActif: {
    color: COULEURS.blanc,
  },
  recapLigne: {
    fontFamily: POLICES.texte,
    fontSize: 16,
    color: COULEURS.blanc,
    textAlign: 'center',
  },
  boutonLancer: {
    marginTop: 8,
  },
});
