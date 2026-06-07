// src/composants/jeu/Canvas.js
// Composant de dessin : capture tactile (dessinateur) et rendu des traits (tous).
// Les coordonnées sont normalisées 0-1 pour être indépendantes de la taille d'écran.
import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Props :
//   traits     : [{ id, couleur, taille, points:[[x,y]...] }] en coords normalisées 0-1
//   fond       : couleur de fond (string CSS)
//   interactif : si true, capture le geste de dessin (dessinateur uniquement)
//   couleur    : couleur du trait en cours
//   taille     : épaisseur du trait en cours (pixels écran)
//   onTraitDebut(traitMeta) : appelé au début d'un trait { id, couleur, taille }
//   onTraitPoints(id, points) : appelé à chaque lot de points throttlé (~50 ms)
//   onTraitFin(id) : appelé à la fin du geste
export default function Canvas({
  traits,
  fond = '#ffffff',
  interactif,
  couleur,
  taille,
  onTraitDebut,
  onTraitPoints,
  onTraitFin,
}) {
  // Dimensions réelles du canvas, mises à jour par onLayout
  const [dimensionsCanvas, setDimensionsCanvas] = useState({ w: 1, h: 1 });
  const traitEnCours = useRef(null);
  const buffer = useRef([]);
  const dernierEnvoi = useRef(0);

  // Convertit des coordonnées écran en coordonnées normalisées 0-1
  const versNorm = (x, y) => [
    Math.min(1, Math.max(0, x / dimensionsCanvas.w)),
    Math.min(1, Math.max(0, y / dimensionsCanvas.h)),
  ];

  const pan = Gesture.Pan()
    .enabled(!!interactif)
    .onBegin((e) => {
      const id = String(Date.now());
      traitEnCours.current = id;
      buffer.current = [versNorm(e.x, e.y)];
      onTraitDebut && onTraitDebut({ id, couleur, taille });
      onTraitPoints && onTraitPoints(id, buffer.current.slice());
    })
    .onUpdate((e) => {
      if (!traitEnCours.current) return;
      buffer.current.push(versNorm(e.x, e.y));
      const maintenant = Date.now();
      // Throttle : envoie les points bufférisés environ toutes les 50 ms
      if (maintenant - dernierEnvoi.current > 50) {
        dernierEnvoi.current = maintenant;
        onTraitPoints && onTraitPoints(traitEnCours.current, buffer.current.splice(0));
      }
    })
    .onEnd(() => {
      // Vider le buffer restant avant de signaler la fin
      if (buffer.current.length) {
        onTraitPoints && onTraitPoints(traitEnCours.current, buffer.current.splice(0));
      }
      onTraitFin && onTraitFin(traitEnCours.current);
      traitEnCours.current = null;
    });

  return (
    <View
      style={styles.zone}
      onLayout={(e) =>
        setDimensionsCanvas({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      <GestureDetector gesture={pan}>
        <Svg width="100%" height="100%">
          {/* Fond de couleur */}
          <Rect x="0" y="0" width="100%" height="100%" fill={fond} />
          {/* Rendu de chaque trait comme un chemin SVG */}
          {traits.map((t) => (
            <Path
              key={t.id}
              d={versChemin(t.points, dimensionsCanvas)}
              stroke={t.couleur}
              strokeWidth={t.taille}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </GestureDetector>
    </View>
  );
}

// Convertit une liste de points normalisés [x,y] en attribut "d" d'un Path SVG,
// à l'échelle des dimensions réelles du canvas.
function versChemin(points, { w, h }) {
  if (!points || !points.length) return '';
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * w} ${y * h}`)
    .join(' ');
}

const styles = StyleSheet.create({
  zone: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
