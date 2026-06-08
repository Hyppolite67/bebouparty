// src/composants/jeu/Canvas.js
// Zone de dessin : capture tactile (dessinateur) + rendu des traits (tous).
//
// On utilise PanResponder (système tactile natif de React Native) plutôt que
// gesture-handler : c'est simple, fiable, tourne sur le thread JS, et il n'y a
// aucun piège de "worklet" ni de seuil d'activation.
//
// Coordonnées normalisées 0-1 (indépendantes de la taille d'écran).
// Le trait EN COURS est dans l'état local du Canvas (affichage fluide) ; les
// traits TERMINÉS sont rendus dans un sous-composant mémoïsé.
import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Liste de points normalisés → attribut "d" d'un Path SVG (à l'échelle du canvas).
function versChemin(points, w, h) {
  if (!points || !points.length) return '';
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`)
    .join(' ');
}

// Rendu mémoïsé des traits terminés (ne se recalcule pas à chaque point du trait en cours).
const TraitsTermines = React.memo(function TraitsTermines({ traits, w, h }) {
  return traits.map((t) => {
    // Un trait d'un seul point = un rond (sinon un Path "M x y" seul ne s'affiche pas)
    if (t.points && t.points.length === 1) {
      const [x, y] = t.points[0];
      return <Circle key={t.id} cx={x * w} cy={y * h} r={Math.max(1, t.taille / 2)} fill={t.couleur} />;
    }
    return (
      <Path key={t.id} d={versChemin(t.points, w, h)} stroke={t.couleur} strokeWidth={t.taille}
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
  });
});

export default function Canvas({
  traits,
  fond = '#ffffff',
  interactif,
  couleur,
  taille,
  onTraitDebut,
  onTraitPoints,
  onTraitFin,
  onTraitTermine,
}) {
  const [dim, setDim] = useState({ w: 1, h: 1 });
  const [actif, setActif] = useState(null); // trait en cours

  // Une seule ref qui contient TOUJOURS les valeurs courantes (lues dans PanResponder).
  const vals = useRef({});
  vals.current.interactif = interactif;
  vals.current.couleur = couleur;
  vals.current.taille = taille;
  vals.current.dim = dim;
  vals.current.onTraitDebut = onTraitDebut;
  vals.current.onTraitPoints = onTraitPoints;
  vals.current.onTraitFin = onTraitFin;
  vals.current.onTraitTermine = onTraitTermine;

  // État interne du trait en cours (hors React pour le buffer réseau).
  const trace = useRef({ id: null, buffer: [], dernier: 0 });

  const norm = (x, y) => {
    const { w, h } = vals.current.dim;
    return [Math.min(1, Math.max(0, x / w)), Math.min(1, Math.max(0, y / h))];
  };

  // Termine le trait en cours (relâchement ou interruption).
  function terminer() {
    const st = trace.current;
    if (!st.id) return;
    const v = vals.current;
    if (v.onTraitPoints && st.buffer.length) { v.onTraitPoints(st.id, st.buffer); st.buffer = []; }
    v.onTraitFin && v.onTraitFin(st.id);
    setActif((prev) => {
      if (prev && v.onTraitTermine) v.onTraitTermine(prev); // remonter le trait complet au parent
      return null;
    });
    st.id = null;
  }

  // PanResponder créé une seule fois ; lit vals.current pour les valeurs à jour.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => vals.current.interactif,
        onStartShouldSetPanResponderCapture: () => vals.current.interactif,
        onMoveShouldSetPanResponder: () => vals.current.interactif,
        onMoveShouldSetPanResponderCapture: () => vals.current.interactif,

        onPanResponderGrant: (e) => {
          if (!vals.current.interactif) return;
          const { locationX, locationY } = e.nativeEvent;
          const p = norm(locationX, locationY);
          const id = String(Date.now()) + Math.random().toString(16).slice(2, 6);
          const c = vals.current.couleur;
          const t = vals.current.taille;
          trace.current = { id, buffer: [p], dernier: Date.now() };
          setActif({ id, couleur: c, taille: t, points: [p] });
          vals.current.onTraitDebut && vals.current.onTraitDebut({ id, couleur: c, taille: t });
        },

        onPanResponderMove: (e) => {
          const st = trace.current;
          if (!st.id) return;
          const { locationX, locationY } = e.nativeEvent;
          const p = norm(locationX, locationY);
          setActif((prev) => (prev ? { ...prev, points: [...prev.points, p] } : prev));
          st.buffer.push(p);
          const now = Date.now();
          if (now - st.dernier > 50) {
            st.dernier = now;
            if (vals.current.onTraitPoints && st.buffer.length) {
              vals.current.onTraitPoints(st.id, st.buffer);
              st.buffer = [];
            }
          }
        },

        onPanResponderRelease: () => terminer(),
        onPanResponderTerminate: () => terminer(),
        onPanResponderTerminationRequest: () => false, // on garde la main pendant qu'on dessine
      }),
    []
  );

  return (
    <View
      style={styles.zone}
      onLayout={(e) =>
        setDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
      {...responder.panHandlers}
    >
      {/* pointerEvents none : le Svg ne capte pas les touches, elles vont au View (PanResponder) */}
      <Svg width="100%" height="100%" pointerEvents="none">
        <Rect x="0" y="0" width="100%" height="100%" fill={fond} />
        <TraitsTermines traits={traits} w={dim.w} h={dim.h} />
        {actif && actif.points.length === 1 && (
          <Circle cx={actif.points[0][0] * dim.w} cy={actif.points[0][1] * dim.h}
            r={Math.max(1, actif.taille / 2)} fill={actif.couleur} />
        )}
        {actif && actif.points.length > 1 && (
          <Path d={versChemin(actif.points, dim.w, dim.h)} stroke={actif.couleur}
            strokeWidth={actif.taille} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
