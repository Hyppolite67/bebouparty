// src/ecrans/EcranAccueil.js
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FondDegrade from '../composants/FondDegrade';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import Mascotte from '../composants/Mascotte';
import CarteGlass from '../composants/CarteGlass';
import { useJoueur } from '../etat/ContexteJoueur';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';
import { MASCOTTE_DEFAUT } from '../donnees/mascotte';

export default function EcranAccueil({ navigation }) {
  const { adresseServeur, setAdresseServeur } = useJoueur();

  // intention = 'creer' ou 'rejoindre' (passée à l'écran Profil)
  const aller = (intention) => navigation.navigate('Profil', { intention });

  return (
    <FondDegrade>
      <View style={styles.centre}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.logo}>BEBOU</Text>
          <Text style={styles.logo2}>PARTY ⚡</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Mascotte config={MASCOTTE_DEFAUT} taille={170} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(400).springify()} style={styles.slogan}>
          Le party game entre amis !
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(550).springify()} style={{ width: '100%', gap: 14 }}>
          <BoutonPrincipal titre="Créer une salle" sousTitre="Sois l'hôte de la partie" icone="➕"
            couleur={COULEURS.violet} ombre={COULEURS.violet} onPress={() => aller('creer')} />
          <BoutonPrincipal titre="Rejoindre une salle" sousTitre="Entre le code d'un ami" icone="🔑"
            couleur={COULEURS.rose} ombre={COULEURS.rose} onPress={() => aller('rejoindre')} />

          <CarteGlass style={{ padding: 12 }}>
            <Text style={styles.petitLabel}>Adresse du PC-serveur</Text>
            <TextInput value={adresseServeur} onChangeText={setAdresseServeur}
              placeholder="192.168.1.10:8080" placeholderTextColor="rgba(255,255,255,0.5)"
              autoCapitalize="none" style={styles.input} />
          </CarteGlass>
        </Animated.View>
      </View>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { fontFamily: POLICES.titre, fontSize: 58, color: COULEURS.blanc, textAlign: 'center', transform: [{ rotate: '-3deg' }] },
  logo2: { fontFamily: POLICES.titre, fontSize: 40, color: COULEURS.jaune, textAlign: 'center', marginTop: -8, transform: [{ rotate: '-3deg' }] },
  slogan: { fontFamily: POLICES.texte, fontSize: 18, color: COULEURS.blanc, marginVertical: 6 },
  petitLabel: { fontFamily: POLICES.texte, fontSize: 12, color: COULEURS.jaune, marginBottom: 4 },
  input: { fontFamily: POLICES.texteGras, fontSize: 16, color: COULEURS.blanc, paddingVertical: 6 },
});
