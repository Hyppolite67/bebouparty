// src/composants/jeu/Canvas.js
// Composant de dessin : capture tactile (dessinateur) et rendu des traits (tous).
// Les coordonnées sont normalisées 0-1 pour être indépendantes de la taille d'écran.
//
// Optimisations clés :
//  - Le trait EN COURS est géré dans l'état local du Canvas (et pas dans l'écran
//    parent) : seul le Canvas se rafraîchit pendant qu'on dessine → fluide.
//  - Les traits TERMINÉS sont rendus dans un sous-composant mémoïsé (ils ne se
//    recalculent pas à chaque point du trait en cours).
//  - La couleur / la taille courantes sont lues via des refs TOUJOURS à jour,
//    pour éviter que le geste ne fige la couleur choisie au démarrage.
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Convertit une liste de points normalisés [x,y] en attribut "d" d'un Path SVG.
function versChemin(points, w, h) {
  if (!points || !points.length) return '';
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`)
    .join(' ');
}

// Rendu mémoïsé des traits terminés : ne se recalcule que si la liste (ou la
// taille du canvas) change réellement — pas à chaque point du trait en cours.
const TraitsTermines = React.memo(function TraitsTermines({ traits, w, h }) {
  return traits.map((t) => (
    <Path
      key={t.id}
      d={versChemin(t.points, w, h)}
      stroke={t.couleur}
      strokeWidth={t.taille}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ));
});

// Props :
//   traits       : [{ id, couleur, taille, points:[[x,y]...] }] traits TERMINÉS (0-1)
//   fond         : couleur de fond (string CSS)
//   interactif   : si true, capture le geste de dessin (dessinateur uniquement)
//   couleur      : couleur du trait en cours
//   taille       : épaisseur du trait en cours (pixels écran)
//   onTraitDebut(meta)        : début d'un trait { id, couleur, taille }
//   onTraitPoints(id, points) : lot de points throttlé (~50 ms) — pour le réseau
//   onTraitFin(id)            : fin du geste
//   onTraitTermine(trait)     : trait complet à ajouter aux traits terminés (parent)
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
  const [actif, setActif] = useState(null); // trait en cours { id, couleur, taille, points }

  // Refs toujours à jour (lues dans le geste pour ne JAMAIS figer la couleur/taille)
  const couleurRef = useRef(couleur);
  const tailleRef = useRef(taille);
  const interactifRef = useRef(interactif);
  const dimRef = useRef(dim);
  useEffect(() => { couleurRef.current = couleur; }, [couleur]);
  useEffect(() => { tailleRef.current = taille; }, [taille]);
  useEffect(() => { interactifRef.current = interactif; }, [interactif]);
  useEffect(() => { dimRef.current = dim; }, [dim]);

  // Le geste est créé UNE seule fois ; il lit les refs pour les valeurs courantes.
  const panRef = useRef(null);
  if (!panRef.current) {
    let bufferReseau = []; // points pas encore envoyés au réseau
    let idCourant = null;
    let dernierEnvoi = 0;

    const versNorm = (x, y) => {
      const { w, h } = dimRef.current;
      return [Math.min(1, Math.max(0, x / w)), Math.min(1, Math.max(0, y / h))];
    };

    panRef.current = Gesture.Pan()
      // runOnJS : les callbacks tournent sur le thread JS (on y appelle setState + réseau)
      .runOnJS(true)
      .onBegin((e) => {
        if (!interactifRef.current) return; // seuls les dessinateurs dessinent
        const id = String(Date.now()) + Math.random().toString(16).slice(2, 6);
        idCourant = id;
        const c = couleurRef.current;
        const t = tailleRef.current;
        const p0 = versNorm(e.x, e.y);
        setActif({ id, couleur: c, taille: t, points: [p0] });
        onTraitDebut && onTraitDebut({ id, couleur: c, taille: t });
        bufferReseau = [p0];
        dernierEnvoi = Date.now();
      })
      .onUpdate((e) => {
        if (!idCourant) return;
        const p = versNorm(e.x, e.y);
        // Affichage local fluide : on ajoute le point au trait en cours
        setActif((prev) => (prev ? { ...prev, points: [...prev.points, p] } : prev));
        // Réseau : on bufférise et on envoie par lots toutes les ~50 ms
        bufferReseau.push(p);
        const now = Date.now();
        if (now - dernierEnvoi > 50) {
          dernierEnvoi = now;
          if (onTraitPoints && bufferReseau.length) {
            onTraitPoints(idCourant, bufferReseau);
            bufferReseau = [];
          }
        }
      })
      .onEnd(() => {
        if (!idCourant) return;
        // Vider le buffer réseau restant
        if (onTraitPoints && bufferReseau.length) {
          onTraitPoints(idCourant, bufferReseau);
          bufferReseau = [];
        }
        onTraitFin && onTraitFin(idCourant);
        // Remonter le trait complet au parent (une seule fois) puis effacer l'actif
        setActif((prev) => {
          if (prev && onTraitTermine) onTraitTermine(prev);
          return null;
        });
        idCourant = null;
      });
  }

  return (
    <View
      style={styles.zone}
      onLayout={(e) =>
        setDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      <GestureDetector gesture={panRef.current}>
        <Svg width="100%" height="100%">
          {/* Fond de couleur */}
          <Rect x="0" y="0" width="100%" height="100%" fill={fond} />
          {/* Traits terminés (mémoïsés) */}
          <TraitsTermines traits={traits} w={dim.w} h={dim.h} />
          {/* Trait en cours (uniquement le dessinateur en a un) */}
          {actif && (
            <Path
              d={versChemin(actif.points, dim.w, dim.h)}
              stroke={actif.couleur}
              strokeWidth={actif.taille}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </GestureDetector>
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
