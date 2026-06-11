// src/ecrans/EcranProfil.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteGlass from '../composants/CarteGlass';
import Mascotte from '../composants/Mascotte';
import SelecteurMascotte from '../composants/SelecteurMascotte';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import { useJoueur } from '../etat/ContexteJoueur';
import * as Reseau from '../reseau/ClientReseau';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';

export default function EcranProfil({ route, navigation }) {
  const intention = route.params?.intention || 'creer';
  const { pseudo, setPseudo, mascotte, setMascotte, sauverProfil, profil } = useJoueur();
  const [code, setCode] = useState('');
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    if (!pseudo.trim()) { Alert.alert('Oups', "Choisis d'abord un surnom !"); return; }
    if (intention === 'rejoindre' && !code.trim()) { Alert.alert('Oups', 'Entre le code de la salle.'); return; }
    setEnCours(true);
    await sauverProfil();
    try {
      // On se connecte au serveur de jeu en ligne (cloud). Marche en WiFi comme en 4G/5G.
      await Reseau.connecter();
    } catch {
      setEnCours(false);
      Alert.alert(
        'Connexion impossible',
        "Le serveur ne répond pas. Réessaie dans quelques secondes (il se réveille parfois) et vérifie ta connexion internet.",
      );
      return;
    }
    if (intention === 'creer') {
      const off = Reseau.sur('salleCreee', ({ code }) => {
        off();
        navigation.replace('SalleAttente', { estHote: true, code });
      });
      Reseau.creerSalle(profil);
    } else {
      // On écoute une éventuelle erreur "salle introuvable"
      const offErr = Reseau.sur('erreur', (e) => { offErr(); setEnCours(false); Alert.alert('Erreur', e.message); });
      Reseau.rejoindreSalle(code.trim().toUpperCase(), profil);
      navigation.replace('SalleAttente', { estHote: false, code: code.trim().toUpperCase() });
    }
  };

  return (
    <FondDegrade>
      <ScrollView contentContainerStyle={{ paddingVertical: 10, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.titre}>Qui es-tu ?</Text>
        <View style={{ alignItems: 'center' }}><Mascotte config={mascotte} taille={150} /></View>

        <CarteGlass style={{ padding: 12 }}>
          <TextInput value={pseudo} onChangeText={setPseudo} placeholder="Ton surnom..."
            placeholderTextColor="rgba(255,255,255,0.5)" style={styles.input} />
        </CarteGlass>

        <SelecteurMascotte config={mascotte} onChange={setMascotte} />

        {intention === 'rejoindre' && (
          <CarteGlass style={{ padding: 12 }}>
            <Text style={styles.label}>Code de la salle</Text>
            <TextInput value={code} onChangeText={setCode} placeholder="BEBOU-0000" autoCapitalize="characters"
              placeholderTextColor="rgba(255,255,255,0.5)" style={styles.input} />
          </CarteGlass>
        )}

        <BoutonPrincipal titre={enCours ? 'Connexion… (réveil du serveur)' : "C'est parti !"} icone="🎉"
          couleur={COULEURS.violet} onPress={valider} desactive={enCours} />
        {enCours && <Text style={styles.hint}>Le serveur se réveille parfois (~30 s la 1re fois). Patiente…</Text>}
      </ScrollView>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: POLICES.titre, fontSize: 30, color: COULEURS.jaune, textAlign: 'center' },
  label: { fontFamily: POLICES.texte, fontSize: 12, color: COULEURS.jaune, marginBottom: 4 },
  input: { fontFamily: POLICES.texteGras, fontSize: 18, color: COULEURS.blanc, paddingVertical: 6 },
  hint: { fontFamily: POLICES.texte, fontSize: 12.5, color: COULEURS.texteDoux, textAlign: 'center' },
});
