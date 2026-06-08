// src/composants/jeu/BarreOutils.js
// Barre d'outils de dessin : palette de couleurs, tailles de pinceau, actions.
// Suit la maquette v3 (jeu-layout-v3.html) : grille encadrée + barre du bas.
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COULEURS } from '../../theme/couleurs';
import { POLICES, RAYONS } from '../../theme/styles';

// 16 couleurs de palette (correspond aux swatches de la maquette v3)
const PALETTE = [
  '#2A1B47', // violet très foncé / quasi-noir
  '#EC6A6A', // rouge corail
  '#FF9F45', // orange
  '#FFD24A', // jaune
  '#A3E635', // lime / vert clair
  '#3DD6E8', // cyan
  '#8B5CF6', // violet
  '#F875B8', // rose / magenta
  '#7A4B2B', // marron
  '#E5484D', // rouge vif
  '#10B981', // vert émeraude
  '#2563EB', // bleu
  '#9AA0AE', // gris
  '#000000', // noir
  '#C4B5FD', // mauve clair
  '#FFFFFF', // blanc
];

// Tailles de pinceau : [valeur en px, taille du point affiché]
const TAILLES = [
  { valeur: 4,  dotSize: 6 },
  { valeur: 10, dotSize: 11 },
  { valeur: 20, dotSize: 17 },
];

// Boutons d'action du bas
const ACTIONS = [
  { emoji: '🧽', label: 'Gomme',   cle: 'gomme' },
  { emoji: '🪣', label: 'Fond',    cle: 'fond' },
  { emoji: '↩️', label: 'Annuler', cle: 'annuler' },
  { emoji: '🗑️', label: 'Effacer', cle: 'effacer' },
];

// Props :
//   couleur      : couleur active (string CSS)
//   setCouleur   : setter couleur
//   taille       : taille du pinceau active (nombre)
//   setTaille    : setter taille
//   gommeActive  : booléen
//   setGomme     : setter gommeActive
//   onFond       : () → applique la couleur courante comme fond du canvas
//   onAnnuler    : () → annule le dernier trait
//   onEffacer    : () → efface tout le canvas
export default function BarreOutils({
  couleur,
  setCouleur,
  taille,
  setTaille,
  gommeActive,
  setGomme,
  onFond,
  onAnnuler,
  onEffacer,
}) {
  const selectionnerCouleur = (c) => {
    setCouleur(c);
    // Sélectionner une couleur désactive automatiquement la gomme
    setGomme(false);
  };

  const gererAction = (cle) => {
    if (cle === 'gomme') {
      setGomme(!gommeActive);
    } else if (cle === 'fond') {
      onFond && onFond(couleur);
    } else if (cle === 'annuler') {
      onAnnuler && onAnnuler();
    } else if (cle === 'effacer') {
      onEffacer && onEffacer();
    }
  };

  return (
    <View style={styles.conteneur}>
      {/* Grille de couleurs — 2 rangées de 8 */}
      <View style={styles.palette}>
        {PALETTE.map((c) => {
          const estSelectionnee = !gommeActive && couleur === c;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => selectionnerCouleur(c)}
              hitSlop={{ top: 8, bottom: 8, left: 5, right: 5 }}
              style={[
                styles.swatch,
                { backgroundColor: c },
                estSelectionnee && styles.swatchSelectionnee,
                // Bordure visible pour le blanc
                c === '#FFFFFF' && styles.swatchBlanc,
              ]}
              activeOpacity={0.75}
            />
          );
        })}
      </View>

      {/* Barre du bas : tailles + boutons d'action */}
      <View style={styles.barreBas}>
        {/* Sélecteur de tailles */}
        <View style={styles.tailles}>
          {TAILLES.map(({ valeur, dotSize }) => {
            const estSelectionnee = taille === valeur;
            return (
              <TouchableOpacity
                key={valeur}
                onPress={() => setTaille(valeur)}
                style={[styles.boutonTaille, estSelectionnee && styles.boutonTailleSelectionnee]}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.point,
                    {
                      width: dotSize,
                      height: dotSize,
                      // Couleur du point : blanc si sélectionné (fond jaune translucide), sinon foncé
                      backgroundColor: estSelectionnee ? COULEURS.jaune : '#2A1B47',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Boutons d'action : Gomme, Fond, Annuler, Effacer */}
        <View style={styles.boutons}>
          {ACTIONS.map(({ emoji, label, cle }) => {
            const estActif = cle === 'gomme' && gommeActive;
            return (
              <TouchableOpacity
                key={cle}
                onPress={() => gererAction(cle)}
                style={[styles.boutonAction, estActif && styles.boutonActionActif]}
                activeOpacity={0.75}
              >
                <Text style={styles.emoji}>{emoji}</Text>
                <Text style={styles.labelBouton}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    // Glassmorphism : fond translucide + bordures blanches + coins arrondis
    backgroundColor: 'rgba(43,27,71,0.38)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.38)',
    borderRadius: RAYONS.carte,
    padding: 8,
    gap: 8,
  },

  // Grille de couleurs : 8 colonnes, pastilles agrandies
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  swatch: {
    // 8 par rangée, plus grosses qu'avant et faciles à toucher (+ hitSlop)
    width: '11.5%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  swatchSelectionnee: {
    // Mise en valeur jaune vif
    shadowColor: COULEURS.jaune,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 6,
    borderColor: '#fff',
    borderWidth: 3,
    // Anneau jaune via outline simulé
    transform: [{ scale: 1.15 }],
  },
  // Bordure visible pour le swatch blanc
  swatchBlanc: {
    borderColor: 'rgba(150,150,150,0.6)',
  },

  // Barre du bas
  barreBas: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 7,
  },

  // Colonne de tailles de pinceau
  tailles: {
    flexDirection: 'row',
    gap: 5,
  },
  boutonTaille: {
    width: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  boutonTailleSelectionnee: {
    borderColor: COULEURS.jaune,
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  point: {
    borderRadius: 50,
  },

  // Boutons d'action (Gomme, Fond, Annuler, Effacer)
  boutons: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  boutonAction: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonActionActif: {
    // Gomme active → mise en valeur jaune
    borderColor: COULEURS.jaune,
    backgroundColor: 'rgba(255,215,0,0.18)',
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  labelBouton: {
    fontSize: 8,
    marginTop: 1,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: POLICES.texte,
  },
});
