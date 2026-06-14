// src/composants/beboudle/TimerIndice.js
// Barre de timer entre deux indices (fenêtre de 15 s). Purement visuel ;
// le serveur décide la vraie cadence. Passe orange→rouge dans les 5 dernières s.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COULEURS } from '../../theme/couleurs';
import { POLICES } from '../../theme/styles';

export default function TimerIndice({ duree = 15, debut }) {
  const [restant, setRestant] = useState(duree);

  useEffect(() => {
    if (!debut || !duree) return;
    const calculer = () => Math.max(0, duree - (Date.now() - debut) / 1000);
    setRestant(calculer());
    const intervalle = setInterval(() => {
      const r = calculer();
      setRestant(r);
      if (r <= 0) clearInterval(intervalle);
    }, 250);
    return () => clearInterval(intervalle);
  }, [debut, duree]);

  const ratio = duree > 0 ? Math.max(0, Math.min(1, restant / duree)) : 0;
  const couleur = restant > 5 ? COULEURS.violet : restant > 2.5 ? '#FF6B35' : COULEURS.erreur;

  return (
    <View>
      <View style={styles.ligne}>
        <Text style={styles.lbl}>⏱ PROCHAIN INDICE</Text>
        <Text style={[styles.sec, { color: couleur }]}>{Math.ceil(restant)}s</Text>
      </View>
      <View style={styles.piste}>
        <View style={[styles.barre, { width: `${ratio * 100}%`, backgroundColor: couleur }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  lbl: { fontFamily: POLICES.titreMoyen, fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.85)' },
  sec: { fontFamily: POLICES.titreMoyen, fontSize: 15 },
  piste: { height: 11, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.28)', overflow: 'hidden' },
  barre: { height: '100%', borderRadius: 8 },
});
