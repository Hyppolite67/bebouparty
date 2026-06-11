// src/composants/turbo/CaseGratter.js
// Une case à gratter.
//
// TECHNIQUE :
//   - L'emoji est affiché dans un <Text> React Native centré en position absolue,
//     DERRIÈRE un <Svg> transparent qui contient uniquement la couche « argent »
//     avec son masque SVG. Cette séparation est plus fiable que SvgText pour les
//     emojis (rendu natif du texte, pas de dépendance SVG).
//   - Le masque SVG creuse la couche argent au fil du grattage (Path tracé).
//   - On suit le % gratté via une grille N×N : chaque cellule touchée est comptée.
//     À ≥ 70 % des cellules, on révèle et on appelle onRevele() UNE seule fois.
//   - PanResponder — pas gesture-handler (bug Reanimated connu sur ce projet).
//
// Props :
//   symboleEmoji  (string)  emoji à afficher sous la couche argent
//   revele        (bool)    forcer la révélation depuis l'extérieur
//   onRevele      (fn)      appelé une seule fois quand la case est révélée
//   id            (string)  id UNIQUE du masque SVG — ex. 'm-0', 'm-1', 'm-2'
//                            (IMPORTANT : 3 cases sur le même écran = 3 ids distincts)

import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
import Svg, { Defs, Mask, Rect, Path } from 'react-native-svg';

// Taille de la grille pour estimer le pourcentage gratté.
// 8×8 = 64 cellules ; seuil à 70 % = ~45 cellules.
const N = 8;
const SEUIL = 0.70;

// Épaisseur du trait de grattage exprimée en fraction de la largeur de la case.
// 0.22 × largeur donne un trait assez large pour gratter confortablement au doigt.
const FRACTION_TRAIT = 0.22;

export default function CaseGratter({ symboleEmoji, revele = false, onRevele, id = 'm-case' }) {
  // Dimensions réelles de la case (mesurées par onLayout).
  const [dim, setDim] = useState({ w: 1, h: 1 });

  // Chemin SVG du trait de grattage accumulé (attribut "d" du Path dans le masque).
  const [chemin, setChemin] = useState('');

  // Révélation locale (déclenchée quand le seuil est atteint).
  const [revLocal, setRevLocal] = useState(false);

  // Cellules de la grille N×N déjà touchées.
  const cellules = useRef(new Set());

  // Verrou anti-double-appel de onRevele.
  const reveleAppele = useRef(false);

  // Ref sur les valeurs courantes pour les lire depuis le PanResponder (créé une seule fois).
  const dimRef = useRef(dim);
  dimRef.current = dim;
  const reveleRef = useRef(revele);
  reveleRef.current = revele;
  const revLocalRef = useRef(revLocal);
  revLocalRef.current = revLocal;

  // Marque la cellule correspondant à (x, y) dans la grille N×N et vérifie le seuil.
  function marquer(x, y) {
    const { w, h } = dimRef.current;
    // Indice de cellule : clamp à [0, N-1] pour rester dans la grille.
    const cx = Math.min(N - 1, Math.max(0, Math.floor((x / w) * N)));
    const cy = Math.min(N - 1, Math.max(0, Math.floor((y / h) * N)));
    cellules.current.add(cy * N + cx);

    const pct = cellules.current.size / (N * N);
    if (pct >= SEUIL && !reveleAppele.current) {
      reveleAppele.current = true;
      setRevLocal(true);
      onRevele && onRevele();
    }
  }

  // PanResponder créé UNE seule fois (via useMemo avec [] vide).
  // Il lit reveleRef et revLocalRef pour ne pas capter les touches une fois révélé.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !reveleRef.current && !revLocalRef.current,
        onStartShouldSetPanResponderCapture: () => !reveleRef.current && !revLocalRef.current,
        onMoveShouldSetPanResponder: () => !reveleRef.current && !revLocalRef.current,
        onMoveShouldSetPanResponderCapture: () => !reveleRef.current && !revLocalRef.current,

        onPanResponderGrant: (e) => {
          if (reveleRef.current || revLocalRef.current) return;
          const { locationX: x, locationY: y } = e.nativeEvent;
          // Début d'un nouveau trait : on repart d'un Move to.
          setChemin((c) => (c ? `${c} M ${x.toFixed(1)} ${y.toFixed(1)}` : `M ${x.toFixed(1)} ${y.toFixed(1)}`));
          marquer(x, y);
        },

        onPanResponderMove: (e) => {
          if (reveleRef.current || revLocalRef.current) return;
          const { locationX: x, locationY: y } = e.nativeEvent;
          // Line to : on prolonge le trait courant.
          setChemin((c) => `${c} L ${x.toFixed(1)} ${y.toFixed(1)}`);
          marquer(x, y);
        },

        // Relâchement ou interruption : rien à faire, on conserve le chemin accumulé.
        onPanResponderRelease: () => {},
        onPanResponderTerminate: () => {},
        // On ne cède PAS le geste pendant qu'on gratte.
        onPanResponderTerminationRequest: () => false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const decouvert = revele || revLocal;
  const epaisseurTrait = Math.max(20, dimRef.current.w * FRACTION_TRAIT);

  return (
    <View
      style={styles.case}
      onLayout={(e) => setDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      {...pan.panHandlers}
    >
      {/* Couche 1 : emoji affiché en Text RN (fiable pour les emojis Unicode) */}
      <View style={styles.emoji} pointerEvents="none">
        <Text style={[styles.emojiTexte, { fontSize: Math.min(dim.w, dim.h) * 0.52 }]}>
          {symboleEmoji}
        </Text>
      </View>

      {/* Couche 2 : SVG transparent qui contient UNIQUEMENT la couche argent + masque.
          pointerEvents="none" : les touches passent au View parent (PanResponder). */}
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {!decouvert && (
          <>
            <Defs>
              {/*
                Le masque :
                  - Fond blanc  → argent visible partout par défaut.
                  - Path noir   → zones grattées = argent transparent = emoji visible.
              */}
              <Mask id={id}>
                <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                {chemin ? (
                  <Path
                    d={chemin}
                    stroke="black"
                    strokeWidth={epaisseurTrait}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </Mask>
            </Defs>

            {/* Couche argent : dégradé simulé via deux Rect superposés.
                Premier rect : couleur de base argentée.
                Second rect : reflet clair semi-transparent pour l'effet métal. */}
            <Rect
              x="0" y="0"
              width="100%" height="100%"
              fill="#cfcfd8"
              mask={`url(#${id})`}
            />
            <Rect
              x="0" y="0"
              width="50%" height="100%"
              fill="rgba(255,255,255,0.30)"
              mask={`url(#${id})`}
            />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  case: {
    flex: 1,
    aspectRatio: 0.74,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    // Ombre interne simulée via shadowColor sur iOS ; elevation sur Android.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiTexte: {
    textAlign: 'center',
    // textShadowColor assombrit légèrement l'emoji pour le contraste.
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
