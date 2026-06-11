// src/composants/turbo/TicketGratter.js
// Le ticket à gratter : 3 cases + UNE seule zone de grattage qui les englobe.
//
// Pourquoi une zone unique ? Avec 3 PanResponder séparés, le doigt « décrochait »
// dans les espaces entre les cases (frustrant). Ici, un SEUL PanResponder couvre
// toute la rangée : on route chaque point vers la case visée (ou la plus proche si
// le doigt est dans un trou), pour un grattage fluide et continu.
//
// Révélation : dès que 50% d'une case est grattée (seuil abaissé pour le confort).
//
// Props :
//   numero          (int)   numéro du ticket
//   onTicketComplet (fn)    appelé avec (symboles) quand les 3 cases sont révélées

import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { SYMBOLES, tirerSymbole } from '../../donnees/symboles';
import { COULEURS } from '../../theme/couleurs';
import { POLICES } from '../../theme/styles';
import CaseGratter from './CaseGratter';

const NOMS_SYMBOLES = {
  fusee: 'Fusée', etoile: 'Étoile', bombe: 'Bombe',
  escargot: 'Escargot', bouclier: 'Bouclier', joker: 'Joker',
};

const N = 8;            // grille 8×8 pour estimer le % gratté
const SEUIL = 0.50;     // révélation dès 50% gratté
const RATIO_CASE = 0.74; // largeur/hauteur d'une case (cohérent avec CaseGratter)

export default function TicketGratter({ numero = 1, onTicketComplet }) {
  const [symboles] = useState(() => [tirerSymbole(), tirerSymbole(), tirerSymbole()]);
  const [chemins, setChemins] = useState(['', '', '']); // tracé gratté (coords locales) par case
  const [revelees, setRevelees] = useState([false, false, false]);

  const frames = useRef([null, null, null]);             // {x,y,w,h} de chaque caseWrap (coords du conteneur)
  const cellules = useRef([new Set(), new Set(), new Set()]);
  const completAppele = useRef(false);
  const reveleesRef = useRef(revelees);
  reveleesRef.current = revelees;

  // Hauteur réelle d'une case (sa largeur / ratio).
  const hauteurCase = (i) => {
    const f = frames.current[i];
    return f ? f.w / RATIO_CASE : 1;
  };

  // Route un point (px,py) du conteneur vers une case ; la plus proche si dans un trou.
  function router(px, py) {
    const fs = frames.current;
    let i = fs.findIndex((f) => f && px >= f.x && px <= f.x + f.w);
    if (i < 0) {
      // Dans un espace entre les cases → la case dont le centre est le plus proche.
      let best = -1, dist = Infinity;
      fs.forEach((f, k) => {
        if (!f) return;
        const centre = f.x + f.w / 2;
        const d = Math.abs(px - centre);
        if (d < dist) { dist = d; best = k; }
      });
      i = best;
    }
    if (i < 0 || !fs[i]) return null;
    const f = fs[i];
    const h = hauteurCase(i);
    return {
      i,
      lx: Math.min(f.w, Math.max(0, px - f.x)),
      ly: Math.min(h, Math.max(0, py - f.y)),
    };
  }

  // Comptabilise la cellule grattée et révèle la case au seuil.
  function marquer(i, lx, ly) {
    const f = frames.current[i];
    if (!f) return;
    const h = hauteurCase(i);
    const cx = Math.min(N - 1, Math.max(0, Math.floor((lx / f.w) * N)));
    const cy = Math.min(N - 1, Math.max(0, Math.floor((ly / h) * N)));
    cellules.current[i].add(cy * N + cx);

    if (cellules.current[i].size / (N * N) >= SEUIL && !reveleesRef.current[i]) {
      setRevelees((prev) => {
        if (prev[i]) return prev;
        const s = [...prev];
        s[i] = true;
        if (s.every(Boolean) && !completAppele.current) {
          completAppele.current = true;
          setTimeout(() => onTicketComplet && onTicketComplet(symboles), 0);
        }
        return s;
      });
    }
  }

  // UN seul PanResponder pour toute la rangée de cases.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          const r = router(x, y);
          if (!r) return;
          setChemins((c) => { const s = [...c]; s[r.i] = `${s[r.i]} M ${r.lx.toFixed(1)} ${r.ly.toFixed(1)}`; return s; });
          marquer(r.i, r.lx, r.ly);
        },
        onPanResponderMove: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          const r = router(x, y);
          if (!r) return;
          setChemins((c) => { const s = [...c]; s[r.i] = `${s[r.i]} L ${r.lx.toFixed(1)} ${r.ly.toFixed(1)}`; return s; });
          marquer(r.i, r.lx, r.ly);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <View style={styles.ticket}>
      {/* En-tête : titre doré + numéro */}
      <View style={styles.ticketHaut}>
        <Text style={styles.ticketTitre}>⚡ TURBO JACKPOT</Text>
        <View style={styles.numeroBadge}>
          <Text style={styles.numeroTexte}>Ticket #{numero}</Text>
        </View>
      </View>

      {/* Zone de grattage UNIQUE (un seul PanResponder pour les 3 cases) */}
      <View style={styles.cases} {...pan.panHandlers}>
        {symboles.map((cle, i) => (
          <View
            key={i}
            style={styles.caseWrap}
            pointerEvents="none"
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              frames.current[i] = { x, y, w: width, h: height };
            }}
          >
            <CaseGratter
              symboleEmoji={SYMBOLES[cle]}
              chemin={chemins[i]}
              revele={revelees[i]}
              id={`m-${i}`}
            />
            <Text style={[styles.labelSymbole, !revelees[i] && styles.labelCache]}>
              {revelees[i] ? NOMS_SYMBOLES[cle] : ' '}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    flex: 1,
    backgroundColor: '#241048',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.45)',
    padding: 12,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ticketHaut: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ticketTitre: {
    fontFamily: POLICES.titreMoyen,
    fontSize: 18,
    color: COULEURS.jaune,
    letterSpacing: 2,
    textShadowColor: 'rgba(255,215,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  numeroBadge: {
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  numeroTexte: { fontFamily: POLICES.texte, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  cases: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  caseWrap: { flex: 1, alignItems: 'center', gap: 7 },
  labelSymbole: {
    fontFamily: POLICES.texteGras,
    fontSize: 11,
    color: COULEURS.jaune,
    height: 16,
    textAlign: 'center',
  },
  labelCache: { color: 'transparent' },
});
