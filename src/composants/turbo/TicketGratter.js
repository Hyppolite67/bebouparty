// src/composants/turbo/TicketGratter.js
// Le ticket à gratter : 3 cases + labels + style maquette.
//
// Au montage, tire 3 symboles aléatoires (tirerSymbole).
// Suit combien de cases sont révélées.
// Quand les 3 sont révélées → appelle onTicketComplet(symboles) UNE seule fois.
//
// Enchaînement de tickets : le PARENT change la prop `key` du TicketGratter
// pour remonter un nouveau ticket ; ce composant ne gère pas l'enchaînement
// lui-même, il se contente de signaler onTicketComplet.
//
// Props :
//   numero          (int)   numéro du ticket affiché en haut à droite (ex. 3)
//   onTicketComplet (fn)    appelé avec (symboles: string[]) quand les 3 cases sont révélées

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SYMBOLES, tirerSymbole } from '../../donnees/symboles';
import { COULEURS } from '../../theme/couleurs';
import { POLICES } from '../../theme/styles';
import CaseGratter from './CaseGratter';

// Noms affichables des symboles (pour le label sous chaque case révélée).
const NOMS_SYMBOLES = {
  fusee:    'Fusée',
  etoile:   'Étoile',
  bombe:    'Bombe',
  escargot: 'Escargot',
  bouclier: 'Bouclier',
  joker:    'Joker',
};

export default function TicketGratter({ numero = 1, onTicketComplet }) {
  // Tire 3 symboles UNE seule fois au montage (via useState initializer).
  const [symboles] = useState(() => [tirerSymbole(), tirerSymbole(), tirerSymbole()]);

  // Tableau de 3 booléens : true si la case i est révélée.
  const [revelees, setRevelees] = useState([false, false, false]);

  // Verrou anti-double-appel de onTicketComplet.
  const completAppele = useRef(false);

  // Appelé par CaseGratter quand la case i atteint le seuil de révélation.
  function surRevele(i) {
    setRevelees((prev) => {
      const suivant = [...prev];
      suivant[i] = true;
      // Vérifier si les 3 cases sont maintenant révélées.
      if (suivant.every(Boolean) && !completAppele.current) {
        completAppele.current = true;
        // Déclencher après le rendu (setState est asynchrone, on use setTimeout 0).
        setTimeout(() => {
          onTicketComplet && onTicketComplet(symboles);
        }, 0);
      }
      return suivant;
    });
  }

  return (
    <View style={styles.ticket}>
      {/* En-tête : titre doré + numéro */}
      <View style={styles.ticketHaut}>
        <Text style={styles.ticketTitre}>⚡ TURBO JACKPOT</Text>
        <View style={styles.numeroBadge}>
          <Text style={styles.numeroTexte}>Ticket #{numero}</Text>
        </View>
      </View>

      {/* Zone des 3 cases */}
      <View style={styles.cases}>
        {symboles.map((cle, i) => (
          <View key={i} style={styles.caseWrap}>
            <CaseGratter
              symboleEmoji={SYMBOLES[cle]}
              revele={revelees[i]}
              onRevele={() => surRevele(i)}
              id={`m-${i}`}
            />
            {/* Label du symbole : visible seulement une fois révélé */}
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
    flex: 1,                       // remplit la zone basse
    // Fond violet foncé avec texture pointillée (simulée par backgroundColor + opacité).
    backgroundColor: '#241048',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.45)',
    padding: 12,
    paddingBottom: 14,
    // Ombre intérieure simulée via shadowColor.
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
    // Ombre texte dorée
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

  numeroTexte: {
    fontFamily: POLICES.texte,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },

  cases: {
    flex: 1,                       // occupe l'espace sous l'en-tête
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    alignItems: 'center',          // cases centrées verticalement dans le ticket
    paddingHorizontal: 2,
    paddingVertical: 6,
  },

  caseWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },

  labelSymbole: {
    fontFamily: POLICES.texteGras,
    fontSize: 11,
    color: COULEURS.jaune,
    height: 16,
    textAlign: 'center',
  },

  labelCache: {
    // Le label est invisible mais garde la hauteur pour éviter le saut de layout.
    color: 'transparent',
  },
});
