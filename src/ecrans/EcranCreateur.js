// src/ecrans/EcranCreateur.js
// Mode créateur (admin, HORS réseau) : gérer la base de personnes/combos de Beboudle.
// Persistance locale AsyncStorage (clé via src/donnees/personnes.js).
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import FondDegrade from '../composants/FondDegrade';
import CarteGlass from '../composants/CarteGlass';
import { chargerPersonnes, sauverPersonnes, nouvelId } from '../donnees/personnes';
import { COULEURS } from '../theme/couleurs';
import { POLICES, RAYONS } from '../theme/styles';

export default function EcranCreateur({ navigation }) {
  const [personnes, setPersonnes] = useState([]);
  const [deplie, setDeplie] = useState({});            // { personneId: bool }
  const [edition, setEdition] = useState(null);        // { personneId, comboIndex|null, valeurs:[4] }
  const [nouveauNom, setNouveauNom] = useState('');

  useEffect(() => { chargerPersonnes().then(setPersonnes); }, []);

  // Sauve + met à jour l'état.
  function appliquer(nouvelle) {
    setPersonnes(nouvelle);
    sauverPersonnes(nouvelle);
  }

  function basculer(id) { setDeplie((d) => ({ ...d, [id]: !d[id] })); }

  function ajouterPersonne() {
    const nom = nouveauNom.trim();
    if (!nom) return;
    const p = { id: nouvelId(nom), nom, combos: [] };
    appliquer([...personnes, p]);
    setNouveauNom('');
    setDeplie((d) => ({ ...d, [p.id]: true }));
  }

  function supprimerPersonne(id) {
    Alert.alert('Supprimer', 'Supprimer cette personne et tous ses combos ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => appliquer(personnes.filter((p) => p.id !== id)) },
    ]);
  }

  function ouvrirEdition(personneId, comboIndex) {
    const p = personnes.find((x) => x.id === personneId);
    const valeurs = comboIndex != null ? [...p.combos[comboIndex]] : ['', '', '', ''];
    setEdition({ personneId, comboIndex, valeurs });
  }

  function majValeur(i, txt) {
    setEdition((e) => { const v = [...e.valeurs]; v[i] = txt; return { ...e, valeurs: v }; });
  }

  function validerCombo() {
    const { personneId, comboIndex, valeurs } = edition;
    const combo = valeurs.map((s) => (s || '').trim());
    if (combo.some((s) => !s)) { Alert.alert('Combo incomplet', 'Renseigne les 4 emojis.'); return; }
    const nouvelle = personnes.map((p) => {
      if (p.id !== personneId) return p;
      const combos = [...p.combos];
      if (comboIndex != null) combos[comboIndex] = combo; else combos.push(combo);
      return { ...p, combos };
    });
    appliquer(nouvelle);
    setEdition(null);
  }

  function supprimerCombo(personneId, comboIndex) {
    const nouvelle = personnes.map((p) =>
      p.id === personneId ? { ...p, combos: p.combos.filter((_, i) => i !== comboIndex) } : p);
    appliquer(nouvelle);
  }

  return (
    <FondDegrade>
      <ScrollView contentContainerStyle={styles.conteneur}>
        <Text style={styles.titre}>Mode créateur ✏️</Text>
        <Text style={styles.sousTitre}>Base de Beboudle (locale à ce téléphone)</Text>

        {/* Ajout d'une personne */}
        <CarteGlass style={styles.carteAjout}>
          <Text style={styles.labelSection}>Nouvelle personne</Text>
          <View style={styles.ligneAjout}>
            <TextInput
              value={nouveauNom}
              onChangeText={setNouveauNom}
              placeholder="Prénom"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.inputNom}
            />
            <Pressable onPress={ajouterPersonne} style={styles.btnAjout}>
              <Text style={styles.btnAjoutTxt}>+ Ajouter</Text>
            </Pressable>
          </View>
        </CarteGlass>

        {/* Liste des personnes */}
        {personnes.map((p) => (
          <CarteGlass key={p.id} style={styles.cartePersonne}>
            <Pressable onPress={() => basculer(p.id)} style={styles.entete}>
              <Text style={styles.nomPersonne}>{p.nom}</Text>
              <Text style={styles.compteur}>{p.combos.length} combo{p.combos.length > 1 ? 's' : ''} {deplie[p.id] ? '▲' : '▼'}</Text>
            </Pressable>

            {deplie[p.id] && (
              <View style={styles.corps}>
                {p.combos.map((combo, idx) => (
                  <View key={idx} style={styles.ligneCombo}>
                    <Text style={styles.comboEmojis}>{combo.join('  ')}</Text>
                    <Pressable onPress={() => ouvrirEdition(p.id, idx)} style={styles.miniBtn}><Text style={styles.miniBtnTxt}>✏️</Text></Pressable>
                    <Pressable onPress={() => supprimerCombo(p.id, idx)} style={styles.miniBtn}><Text style={styles.miniBtnTxt}>🗑️</Text></Pressable>
                  </View>
                ))}
                <View style={styles.actionsPersonne}>
                  <Pressable onPress={() => ouvrirEdition(p.id, null)} style={styles.btnSecondaire}>
                    <Text style={styles.btnSecondaireTxt}>+ Ajouter un combo</Text>
                  </Pressable>
                  <Pressable onPress={() => supprimerPersonne(p.id)} style={styles.btnSupprimer}>
                    <Text style={styles.btnSupprimerTxt}>Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </CarteGlass>
        ))}

        <Pressable onPress={() => navigation.goBack()} style={styles.btnRetour}>
          <Text style={styles.btnRetourTxt}>← Retour</Text>
        </Pressable>
      </ScrollView>

      {/* Éditeur de combo (overlay) */}
      {edition && (
        <View style={styles.overlay}>
          <CarteGlass style={styles.editeur}>
            <Text style={styles.labelSection}>Combo de 4 emojis</Text>
            <Text style={styles.aide}>Utilise le clavier emoji de ton téléphone</Text>
            <View style={styles.casesEdit}>
              {edition.valeurs.map((v, i) => (
                <TextInput
                  key={i}
                  value={v}
                  onChangeText={(t) => majValeur(i, t)}
                  placeholder="?"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.caseEdit}
                  autoCorrect={false}
                />
              ))}
            </View>
            <Text style={styles.apercuLabel}>Aperçu</Text>
            <Text style={styles.apercu}>{edition.valeurs.map((s) => s || '·').join('  ')}</Text>
            <View style={styles.actionsEdit}>
              <Pressable onPress={() => setEdition(null)} style={styles.btnAnnuler}><Text style={styles.btnAnnulerTxt}>Annuler</Text></Pressable>
              <Pressable onPress={validerCombo} style={styles.btnValider}><Text style={styles.btnValiderTxt}>Valider</Text></Pressable>
            </View>
          </CarteGlass>
        </View>
      )}
    </FondDegrade>
  );
}

const styles = StyleSheet.create({
  conteneur: { padding: 18, paddingBottom: 40, gap: 14 },
  titre: { fontFamily: POLICES.titre, fontSize: 28, color: COULEURS.jaune, textAlign: 'center' },
  sousTitre: { fontFamily: POLICES.texte, fontSize: 13, color: COULEURS.texteDoux, textAlign: 'center', marginTop: -6 },

  carteAjout: { gap: 8 },
  labelSection: { fontFamily: POLICES.titreMoyen, fontSize: 17, color: COULEURS.blanc },
  ligneAjout: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  inputNom: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: RAYONS.petit, borderWidth: 1.5,
    borderColor: COULEURS.verreBordure, color: COULEURS.blanc, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: POLICES.texte,
  },
  btnAjout: { backgroundColor: COULEURS.violet, borderRadius: RAYONS.petit, paddingHorizontal: 14, paddingVertical: 11 },
  btnAjoutTxt: { fontFamily: POLICES.texteGras, color: COULEURS.blanc, fontSize: 14 },

  cartePersonne: { gap: 8 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nomPersonne: { fontFamily: POLICES.titreMoyen, fontSize: 18, color: COULEURS.blanc },
  compteur: { fontFamily: POLICES.texte, fontSize: 13, color: COULEURS.texteDoux },
  corps: { gap: 8, marginTop: 4 },
  ligneCombo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RAYONS.petit, paddingHorizontal: 12, paddingVertical: 8 },
  comboEmojis: { flex: 1, fontSize: 22 },
  miniBtn: { padding: 4 },
  miniBtnTxt: { fontSize: 18 },
  actionsPersonne: { flexDirection: 'row', gap: 10, marginTop: 2 },
  btnSecondaire: { flex: 1, backgroundColor: COULEURS.verre, borderRadius: RAYONS.petit, borderWidth: 1.5, borderColor: COULEURS.verreBordure, paddingVertical: 10, alignItems: 'center' },
  btnSecondaireTxt: { fontFamily: POLICES.texteGras, color: COULEURS.blanc, fontSize: 14 },
  btnSupprimer: { paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  btnSupprimerTxt: { fontFamily: POLICES.texte, color: COULEURS.erreur, fontSize: 14 },

  btnRetour: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 24 },
  btnRetourTxt: { fontFamily: POLICES.texteGras, color: COULEURS.blanc, fontSize: 16 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,10,34,0.7)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  editeur: { width: '100%', gap: 10 },
  aide: { fontFamily: POLICES.texte, fontSize: 12, color: COULEURS.texteDoux, marginTop: -4 },
  casesEdit: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  caseEdit: {
    width: 58, height: 58, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 2, borderColor: COULEURS.verreBordure,
    textAlign: 'center', fontSize: 28, color: COULEURS.blanc,
  },
  apercuLabel: { fontFamily: POLICES.texte, fontSize: 12, color: COULEURS.texteDoux, textAlign: 'center' },
  apercu: { fontSize: 28, textAlign: 'center', letterSpacing: 2 },
  actionsEdit: { flexDirection: 'row', gap: 12, marginTop: 6 },
  btnAnnuler: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: RAYONS.bouton, backgroundColor: COULEURS.verre, borderWidth: 1.5, borderColor: COULEURS.verreBordure },
  btnAnnulerTxt: { fontFamily: POLICES.texteGras, color: COULEURS.blanc, fontSize: 15 },
  btnValider: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: RAYONS.bouton, backgroundColor: COULEURS.rose },
  btnValiderTxt: { fontFamily: POLICES.texteGras, color: COULEURS.blanc, fontSize: 15 },
});
