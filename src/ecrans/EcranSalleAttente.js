// src/ecrans/EcranSalleAttente.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteGlass from '../composants/CarteGlass';
import CarteJoueur from '../composants/CarteJoueur';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import BandeauErreur from '../composants/BandeauErreur';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function EcranSalleAttente({ route, navigation }) {
  const { estHote, code } = route.params;
  const [joueurs, setJoueurs] = useState([]);

  useEffect(() => {
    const off1 = Reseau.sur('listeJoueurs', setJoueurs);
    const off2 = Reseau.sur('partieLancee', () => {
      navigation.replace(estHote ? 'SelectionJeu' : 'AttenteJeu');
    });
    const off3 = Reseau.sur('erreur', () => navigation.replace('Accueil'));
    const off4 = Reseau.sur('deconnecte', () => navigation.replace('Accueil'));
    return () => { off1(); off2(); off3(); off4(); };
  }, []);

  const assezDeJoueurs = joueurs.length >= 2;

  return (
    <FondDegrade>
      {/* Bandeau de déconnexion — en position absolue, se superpose au contenu */}
      <BandeauErreur onReessayer={() => navigation.replace('Accueil')} />
      <View style={{ flex: 1, paddingTop: 10 }}>
        {estHote ? (
          <CarteGlass style={styles.codeBox}>
            <Text style={styles.codeLabel}>Code de la salle</Text>
            <Text style={styles.code}>{code}</Text>
            <Text style={styles.partage}>Partage-le avec tes amis !</Text>
          </CarteGlass>
        ) : (
          <Text style={styles.attente}>En attente que l'hôte lance la partie...</Text>
        )}

        <Text style={styles.compteur}>{joueurs.length} joueur(s) connecté(s)</Text>
        <FlatList data={joueurs} keyExtractor={(j) => j.id} numColumns={3}
          columnWrapperStyle={{ gap: 10, justifyContent: 'center' }}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          renderItem={({ item }) => <CarteJoueur joueur={item} />} />

        {estHote && (
          <BoutonPrincipal titre="Lancer la partie" icone="🚀" couleur={COULEURS.violet}
            desactive={!assezDeJoueurs} onPress={() => Reseau.lancerPartie()} />
        )}
        {estHote && !assezDeJoueurs && <Text style={styles.info}>Il faut au moins 2 joueurs</Text>}
      </View>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  codeBox: { alignItems: 'center', marginBottom: 14 },
  codeLabel: { fontFamily: POLICES.texte, fontSize: 13, color: COULEURS.texteDoux },
  code: { fontFamily: POLICES.titre, fontSize: 40, color: COULEURS.jaune, letterSpacing: 2 },
  partage: { fontFamily: POLICES.texte, fontSize: 13, color: COULEURS.blanc },
  attente: { fontFamily: POLICES.titreMoyen, fontSize: 20, color: COULEURS.blanc, textAlign: 'center', marginBottom: 14 },
  compteur: { fontFamily: POLICES.texteGras, fontSize: 15, color: COULEURS.blanc, textAlign: 'center', marginBottom: 10 },
  info: { fontFamily: POLICES.texte, fontSize: 13, color: COULEURS.texteDoux, textAlign: 'center', marginTop: 6 },
});
