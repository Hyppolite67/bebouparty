// src/composants/SelecteurMascotte.js
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CREATURES, TRONCHES, ACCESSOIRES, COULEURS_MASCOTTE, mascotteAleatoire } from '../donnees/mascotte';
import { COULEURS } from '../theme/couleurs';
import { POLICES, RAYONS } from '../theme/styles';

const AXES = [
  { cle: 'creature', label: 'Créature', liste: CREATURES },
  { cle: 'tronche', label: 'Tronche', liste: TRONCHES },
  { cle: 'accessoire', label: 'Accessoire', liste: ACCESSOIRES },
  { cle: 'couleur', label: 'Couleur', liste: COULEURS_MASCOTTE },
];

function Ligne({ axe, valeurIndex, onCycle }) {
  const item = axe.liste[valeurIndex];
  return (
    <View style={styles.ligne}>
      <Text style={styles.label}>{axe.label}</Text>
      <View style={styles.picker}>
        <Pressable style={styles.fleche} onPress={() => onCycle(-1)}><Text style={styles.flecheTxt}>‹</Text></Pressable>
        <View style={styles.valeurZone}>
          {axe.cle === 'couleur' && <View style={[styles.pastille, { backgroundColor: item.valeur }]} />}
          <Text style={styles.valeur}>{item.nom}</Text>
          <Text style={styles.idx}>{valeurIndex + 1}/{axe.liste.length}</Text>
        </View>
        <Pressable style={styles.fleche} onPress={() => onCycle(1)}><Text style={styles.flecheTxt}>›</Text></Pressable>
      </View>
    </View>
  );
}

export default function SelecteurMascotte({ config, onChange }) {
  const cycler = (cle, liste, dir) => {
    const n = liste.length;
    onChange({ ...config, [cle]: (config[cle] + dir + n) % n });
  };
  return (
    <View style={{ gap: 10 }}>
      {AXES.map((axe) => (
        <Ligne key={axe.cle} axe={axe} valeurIndex={config[axe.cle]} onCycle={(d) => cycler(axe.cle, axe.liste, d)} />
      ))}
      <Pressable style={styles.hasard} onPress={() => onChange(mascotteAleatoire())}>
        <Text style={styles.hasardTxt}>🎲 Au hasard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { backgroundColor: COULEURS.verre, borderColor: COULEURS.verreBordure, borderWidth: 1.5, borderRadius: 18, padding: 8, flexDirection: 'row', alignItems: 'center' },
  label: { width: 90, color: COULEURS.jaune, fontFamily: POLICES.texteGras, fontSize: 12, textTransform: 'uppercase', paddingLeft: 6 },
  picker: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fleche: { width: 36, height: 36, borderRadius: 12, backgroundColor: COULEURS.verrou, alignItems: 'center', justifyContent: 'center' },
  flecheTxt: { color: COULEURS.blanc, fontSize: 20, fontFamily: POLICES.texteGras },
  valeurZone: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valeur: { color: COULEURS.blanc, fontFamily: POLICES.texteGras, fontSize: 14 },
  idx: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  pastille: { width: 16, height: 16, borderRadius: 8 },
  hasard: { backgroundColor: COULEURS.verre, borderColor: COULEURS.verreBordure, borderWidth: 1.5, borderRadius: RAYONS.bouton, padding: 14, alignItems: 'center' },
  hasardTxt: { color: COULEURS.blanc, fontFamily: POLICES.texteGras, fontSize: 16 },
});
