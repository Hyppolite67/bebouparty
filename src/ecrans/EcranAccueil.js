// src/ecrans/EcranAccueil.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FondDegrade from '../composants/FondDegrade';
import BoutonPrincipal from '../composants/BoutonPrincipal';
import Mascotte from '../composants/Mascotte';
import { COULEURS } from '../theme/couleurs';
import { POLICES, RAYONS } from '../theme/styles';
import { MASCOTTE_DEFAUT } from '../donnees/mascotte';

const CODE_CREATEUR = '7285';

export default function EcranAccueil({ navigation }) {
  // intention = 'creer' ou 'rejoindre' (passée à l'écran Profil)
  const aller = (intention) => navigation.navigate('Profil', { intention });

  // Porte d'accès au mode créateur (code 7285)
  const [porteOuverte, setPorteOuverte] = useState(false);
  const [code, setCode] = useState('');
  const valider = () => {
    if (code === CODE_CREATEUR) {
      setPorteOuverte(false); setCode('');
      navigation.navigate('Createur');
    } else {
      setCode('');
    }
  };

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

      {/* Bouton discret d'accès au mode créateur */}
      <Pressable onPress={() => setPorteOuverte(true)} style={styles.boutonCreateur} hitSlop={12}>
        <Text style={styles.boutonCreateurTxt}>✏️</Text>
      </Pressable>

      {/* Porte : saisie du code 7285 */}
      <Modal visible={porteOuverte} transparent animationType="fade" onRequestClose={() => setPorteOuverte(false)}>
        <Pressable style={styles.modalFond} onPress={() => { setPorteOuverte(false); setCode(''); }}>
          <Pressable style={styles.modalCarte} onPress={() => {}}>
            <Text style={styles.modalTitre}>Mode créateur</Text>
            <Text style={styles.modalAide}>Entre le code d'accès</Text>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              autoFocus
              maxLength={4}
              style={styles.modalInput}
              onSubmitEditing={valider}
            />
            <Pressable onPress={valider} style={styles.modalBtn}>
              <Text style={styles.modalBtnTxt}>Entrer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { fontFamily: POLICES.titre, fontSize: 58, color: COULEURS.blanc, textAlign: 'center', transform: [{ rotate: '-3deg' }] },
  logo2: { fontFamily: POLICES.titre, fontSize: 40, color: COULEURS.jaune, textAlign: 'center', marginTop: -8, transform: [{ rotate: '-3deg' }] },
  slogan: { fontFamily: POLICES.texte, fontSize: 18, color: COULEURS.blanc, marginVertical: 6 },

  boutonCreateur: { position: 'absolute', bottom: 18, right: 18, opacity: 0.35, padding: 8 },
  boutonCreateurTxt: { fontSize: 20 },

  modalFond: { flex: 1, backgroundColor: 'rgba(20,10,34,0.72)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  modalCarte: {
    width: '100%', backgroundColor: 'rgba(43,27,71,0.97)', borderRadius: RAYONS.carte, borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.4)', padding: 22, alignItems: 'center', gap: 12,
  },
  modalTitre: { fontFamily: POLICES.titre, fontSize: 24, color: COULEURS.jaune },
  modalAide: { fontFamily: POLICES.texte, fontSize: 14, color: COULEURS.texteDoux, marginTop: -6 },
  modalInput: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RAYONS.petit, borderWidth: 1.5, borderColor: COULEURS.verreBordure,
    color: COULEURS.blanc, fontSize: 28, letterSpacing: 12, textAlign: 'center', paddingVertical: 10, width: 180,
  },
  modalBtn: { backgroundColor: COULEURS.violet, borderRadius: RAYONS.bouton, paddingVertical: 12, paddingHorizontal: 32 },
  modalBtnTxt: { fontFamily: POLICES.texteGras, color: COULEURS.blanc, fontSize: 16 },
});
