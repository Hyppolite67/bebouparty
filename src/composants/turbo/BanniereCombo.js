// src/composants/turbo/BanniereCombo.js
// Bannière de résultat d'un combo (slide-up à l'apparition).
// Le PARENT contrôle l'affichage : il monte/démonte le composant pendant ~1,5 s.
// Props :
//   nom        {string}  — ex. "TURBO MAX"
//   description{string}  — ex. "Tu avances de 3 cases !"
//   ton        {string}  — 'vert' | 'rouge' | 'bleu' | 'dore'
//   icone      {string}  — emoji, ex. "🚀"
// Ou : un seul objet `combo` { nom, description, ton, icone } (les deux syntaxes sont acceptées).

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { POLICES } from '../../theme/styles';

// Couleurs de fond selon le ton
const COULEURS_TON = {
  vert: '#34D399',
  rouge: '#EF4444',
  bleu: '#3B82F6',
  dore: '#FFD700',
};
// Couleur du texte (sombre sur fond clair, blanc sur fond foncé)
const TEXTE_TON = {
  vert: '#083b23',
  rouge: '#fff',
  bleu: '#fff',
  dore: '#3a2600',
};

export default function BanniereCombo({ combo, nom, description, ton, icone }) {
  // Résolution des props (syntaxe objet ou props plates)
  const _nom = (combo && combo.nom) || nom || '';
  const _desc = (combo && combo.description) || description || '';
  const _ton = (combo && combo.ton) || ton || 'dore';
  const _icone = (combo && combo.icone) || icone || '⚡';

  // Animation slide-up (translateY de +60 → 0) + fondu
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Entrée : slide-up rapide avec spring naturel
    translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
  }, []);

  const styleAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const couleurFond = COULEURS_TON[_ton] || COULEURS_TON.dore;
  const couleurTexte = TEXTE_TON[_ton] || TEXTE_TON.dore;

  return (
    <Animated.View style={[styles.banniere, { backgroundColor: couleurFond }, styleAnim]}>
      {/* Icône */}
      <Text style={styles.icone}>{_icone}</Text>
      {/* Nom du combo en grand, espacé, style Baloo */}
      <Text style={[styles.nom, { color: couleurTexte }]}>
        {_nom.split('').join(' ')}
      </Text>
      {/* Description de l'effet */}
      {!!_desc && (
        <Text style={[styles.description, { color: couleurTexte }]}>{_desc}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banniere: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    // Ombre portée
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  icone: {
    fontSize: 22,
    marginBottom: 2,
  },
  nom: {
    fontFamily: POLICES.titre,
    fontSize: 22,
    letterSpacing: 3,
    textAlign: 'center',
  },
  description: {
    fontFamily: POLICES.texteGras,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
    opacity: 0.9,
  },
});
