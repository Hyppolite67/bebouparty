// src/ecrans/EcranSelectionJeu.js
import React, { useEffect } from 'react';
import { Text, StyleSheet, FlatList } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteMiniJeu from '../composants/CarteMiniJeu';
import BandeauErreur from '../composants/BandeauErreur';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

const JEUX = [
  { id: 'dessin', nom: 'Devine le dessin', icone: '🖌️', couleur: COULEURS.violet, description: 'Dessine, les autres devinent !', verrouille: false },
  ...[...Array(7)].map((_, i) => ({ id: 'verrou' + i, verrouille: true })),
];

export default function EcranSelectionJeu({ navigation }) {
  useEffect(() => {
    const off = Reseau.sur('jeuChoisi', () => navigation.replace('JeuDessin'));
    return off;
  }, []);

  const choisir = (jeu) => { Reseau.choisirJeu(jeu.id); /* le serveur renverra JEU_CHOISI à tous */ };

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
