// src/ecrans/EcranAccueil.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FondDegrade from '../composants/FondDegrade';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import Mascotte from '../composants/Mascotte';
import { COULEURS } from '../theme/couleurs';
import { POLICES } from '../theme/styles';
import { MASCOTTE_DEFAUT } from '../donnees/mascotte';

export default function EcranAccueil({ navigation }) {
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
});
