// src/ecrans/EcranAttenteJeu.js
import React, { useEffect } from 'react';
import { Text, StyleSheet, View, Alert } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import Mascotte from '../composants/Mascotte';
import BandeauErreur from '../composants/BandeauErreur';
import * as Reseau from '../reseau/ClientReseau';
import { useJoueur } from '../etat/ContexteJoueur';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function EcranAttenteJeu({ navigation }) {
  const { mascotte } = useJoueur();
  useEffect(() => {
    // Routage selon le jeu choisi par l'hôte (idJeu = 'turbo', 'beboudle' ou 'dessin')
    const off1 = Reseau.sur('jeuChoisi', (idJeu) => {
      const ecran = idJeu === 'turbo' ? 'TurboJackpot' : idJeu === 'beboudle' ? 'Beboudle' : 'JeuDessin';
      navigation.replace(ecran);
    });
    // Si l'hôte quitte avant de choisir, on ne reste pas bloqué ici.
    const off2 = Reseau.sur('erreur', (e) => {
      Alert.alert('Partie terminée', e?.message || 'L\'hôte a quitté la partie.');
      navigation.replace('Accueil');
    });
    return () => { off1(); off2(); };
  }, []);
  return (
    <FondDegrade>
      {/* Bandeau de déconnexion — en position absolue, se superpose au contenu */}
      <BandeauErreur onReessayer={() => navigation.replace('Accueil')} />
      <View style={styles.c}>
        <Mascotte config={mascotte} taille={160} />
        <Text style={styles.txt}>L'hôte choisit le jeu...</Text>
      </View>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  txt: { fontFamily: POLICES.titreMoyen, fontSize: 20, color: COULEURS.blanc },
});
