// src/ecrans/EcranSelectionJeu.js
import React, { useEffect } from 'react';
import { Text, StyleSheet, FlatList, Alert } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteMiniJeu from '../composants/CarteMiniJeu';
import BandeauErreur from '../composants/BandeauErreur';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

const JEUX = [
  { id: 'dessin', nom: 'Devine le dessin', icone: '🖌️', couleur: COULEURS.violet, description: 'Dessine, les autres devinent !', verrouille: false },
  { id: 'turbo',  nom: 'Turbo Jackpot',    icone: '🏎️', couleur: '#FF9F45',        description: 'Gratte et fonce !',             verrouille: false },
  ...[...Array(6)].map((_, i) => ({ id: 'verrou' + i, verrouille: true })),
];

export default function EcranSelectionJeu({ navigation }) {
  useEffect(() => {
    const off1 = Reseau.sur('jeuChoisi', () => navigation.replace('JeuDessin'));
    // Si quelque chose ferme la salle, on revient à l'accueil avec un message.
    const off2 = Reseau.sur('erreur', (e) => {
      Alert.alert('Partie terminée', e?.message || 'La salle a été fermée.');
      navigation.replace('Accueil');
    });
    return () => { off1(); off2(); };
  }, []);

  // Pour « Devine le dessin », l'hôte passe par l'écran de réglages.
  // Pour « Turbo Jackpot », on choisit directement (pas de réglages).
  // Les joueurs non-hôtes sont redirigés par l'abonnement jeuChoisi ci-dessus.
  const choisir = (jeu) => {
    if (jeu.id === 'turbo') {
      Reseau.choisirJeu('turbo');
    } else {
      navigation.navigate('ReglagesPartie');
    }
  };

  return (
    <FondDegrade>
      {/* Bandeau de déconnexion — en position absolue, se superpose au contenu */}
      <BandeauErreur onReessayer={() => navigation.replace('Accueil')} />
      <Text style={styles.titre}>Quel jeu on joue ?</Text>
      <FlatList data={JEUX} keyExtractor={(j) => j.id} numColumns={2}
        columnWrapperStyle={{ gap: 12 }} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}
        renderItem={({ item }) => <CarteMiniJeu jeu={item} onPress={() => choisir(item)} />} />
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: POLICES.titre, fontSize: 28, color: COULEURS.jaune, textAlign: 'center', marginVertical: 10 },
});
