// src/composants/Mascotte.js
// Rend une mascotte à partir d'une config { creature, tronche, accessoire, couleur }.
// Optionnellement animée (flotte + se balance comme de la gelée).
import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import Svg, { Path, Ellipse, Circle, Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { CREATURES, COULEURS_MASCOTTE } from '../donnees/mascotte';

const D = '#2A1B47'; // contour foncé

// --- Les 10 tronches (yeux ~ x80/x120, y98 ; bouche ~ y120) ---
function rendreTronche(i) {
  switch (i) {
    case 0: return (
      <G>{/* Mignon */}
        <Ellipse cx="80" cy="98" rx="14" ry="16" fill="#fff" />
        <Ellipse cx="120" cy="98" rx="14" ry="16" fill="#fff" />
        <Circle cx="83" cy="101" r="7" fill={D} />
        <Circle cx="117" cy="101" r="7" fill={D} />
        <Circle cx="86" cy="98" r="2.4" fill="#fff" />
        <Circle cx="120" cy="98" r="2.4" fill="#fff" />
        <Circle cx="58" cy="116" r="9" fill="#FF8FC7" opacity="0.7" />
        <Circle cx="142" cy="116" r="9" fill="#FF8FC7" opacity="0.7" />
        <Path d="M92 118 Q100 126 108 118" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" />
      </G>
    );
    case 1: return (
      <G>{/* Louche */}
        <Ellipse cx="80" cy="98" rx="14" ry="16" fill="#fff" />
        <Ellipse cx="120" cy="98" rx="14" ry="16" fill="#fff" />
        <Circle cx="90" cy="100" r="7" fill={D} />
        <Circle cx="110" cy="100" r="7" fill={D} />
        <Path d="M90 120 Q95 116 100 120 Q105 124 110 120" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" />
      </G>
    );
    case 2: return (
      <G>{/* Langue pendante */}
        <Path d="M68 96 q12 -7 24 0" stroke={D} strokeWidth="4" fill="none" strokeLinecap="round" />
        <Path d="M108 96 q12 -7 24 0" stroke={D} strokeWidth="4" fill="none" strokeLinecap="round" />
        <Circle cx="80" cy="104" r="5" fill={D} />
        <Circle cx="120" cy="104" r="5" fill={D} />
        <Path d="M88 118 Q100 122 112 118" stroke={D} strokeWidth="3" fill="none" />
        <Path d="M96 119 Q100 119 104 119 L104 136 Q100 142 96 136 Z" fill="#FF6FA0" stroke={D} strokeWidth="2" />
      </G>
    );
    case 3: return (
      <G>{/* KO (x_x) */}
        <Path d="M72 91 L88 105 M88 91 L72 105" stroke={D} strokeWidth="4" strokeLinecap="round" />
        <Path d="M112 91 L128 105 M128 91 L112 105" stroke={D} strokeWidth="4" strokeLinecap="round" />
        <Path d="M90 122 Q95 117 100 122 Q105 127 110 122" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" />
      </G>
    );
    case 4: return (
      <G>{/* Sourcil unique */}
        <Path d="M66 84 Q100 76 134 84" stroke={D} strokeWidth="6" fill="none" strokeLinecap="round" />
        <Ellipse cx="80" cy="100" rx="12" ry="13" fill="#fff" />
        <Ellipse cx="120" cy="100" rx="12" ry="13" fill="#fff" />
        <Circle cx="84" cy="102" r="6" fill={D} />
        <Circle cx="116" cy="102" r="6" fill={D} />
        <Path d="M90 122 L110 122" stroke={D} strokeWidth="3" strokeLinecap="round" />
      </G>
    );
    case 5: return (
      <G>{/* Psychopathe */}
        <Ellipse cx="80" cy="96" rx="16" ry="18" fill="#fff" />
        <Ellipse cx="120" cy="96" rx="16" ry="18" fill="#fff" />
        <Circle cx="80" cy="98" r="4" fill={D} />
        <Circle cx="120" cy="98" r="4" fill={D} />
        <Path d="M80 116 Q100 140 120 116 Z" fill="#fff" stroke={D} strokeWidth="2.5" />
        <Path d="M90 117 L90 130 M100 119 L100 133 M110 117 L110 130" stroke={D} strokeWidth="2" />
      </G>
    );
    case 6: return (
      <G>{/* Choqué */}
        <Ellipse cx="80" cy="96" rx="15" ry="19" fill="#fff" />
        <Ellipse cx="120" cy="96" rx="15" ry="19" fill="#fff" />
        <Circle cx="80" cy="94" r="5" fill={D} />
        <Circle cx="120" cy="94" r="5" fill={D} />
        <Ellipse cx="100" cy="124" rx="6" ry="8" fill={D} />
      </G>
    );
    case 7: return (
      <G>{/* Clin d'œil */}
        <Ellipse cx="80" cy="98" rx="14" ry="16" fill="#fff" />
        <Circle cx="82" cy="100" r="7" fill={D} />
        <Circle cx="84" cy="97" r="2.2" fill="#fff" />
        <Path d="M110 99 Q120 93 130 99" stroke={D} strokeWidth="4" fill="none" strokeLinecap="round" />
        <Path d="M88 119 Q104 129 114 117" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" />
      </G>
    );
    case 8: return (
      <G>{/* Blasé */}
        <Path d="M70 99 L90 99" stroke={D} strokeWidth="5" strokeLinecap="round" />
        <Path d="M110 99 L130 99" stroke={D} strokeWidth="5" strokeLinecap="round" />
        <Path d="M90 124 Q100 120 110 124" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" />
      </G>
    );
    case 9: return (
      <G>{/* Dents du bonheur */}
        <Path d="M70 96 Q80 86 90 96" stroke={D} strokeWidth="4" fill="none" strokeLinecap="round" />
        <Path d="M110 96 Q120 86 130 96" stroke={D} strokeWidth="4" fill="none" strokeLinecap="round" />
        <Path d="M84 116 Q100 134 116 116 Z" fill="#B23A6B" stroke={D} strokeWidth="2" />
        <Rect x="94" y="116" width="5" height="10" rx="1.5" fill="#fff" />
        <Rect x="101" y="116" width="5" height="10" rx="1.5" fill="#fff" />
      </G>
    );
    default: return rendreTronche(0);
  }
}

// --- Les 10 accessoires ---
function rendreAccessoire(i, couleur) {
  switch (i) {
    case 0: return null; // Aucun
    case 1: return (
      <G>{/* Lunettes de fête */}
        <Rect x="58" y="88" width="84" height="22" rx="9" fill="#1f1330" />
        <Rect x="61" y="90" width="36" height="9" rx="4" fill="#06B6D4" />
        <Rect x="103" y="90" width="36" height="9" rx="4" fill="#EC4899" />
        <Rect x="96" y="94" width="8" height="6" fill="#1f1330" />
      </G>
    );
    case 2: return (
      <G>{/* Couronne */}
        <Path d="M68 44 L72 22 L86 38 L100 16 L114 38 L128 22 L132 44 Z" fill="#FFD24A" stroke="#E0A21B" strokeWidth="2.5" strokeLinejoin="round" />
        <Rect x="68" y="41" width="64" height="9" rx="4" fill="#E0A21B" />
      </G>
    );
    case 3: return (
      <G>{/* Chapeau de fête */}
        <Path d="M100 2 L124 48 L76 48 Z" fill="#EC4899" />
        <Path d="M88 36 L112 36 L108 48 L92 48 Z" fill="#FFD24A" />
        <Circle cx="100" cy="3" r="7" fill="#FFD700" />
      </G>
    );
    case 4: return (
      <G>{/* Corne licorne */}
        <Path d="M100 2 L109 44 L91 44 Z" fill="#FFD24A" stroke="#E0A21B" strokeWidth="2" />
        <Path d="M94 40 L106 33 M93 31 L105 24 M94 23 L104 17" stroke="#E0A21B" strokeWidth="2" strokeLinecap="round" />
      </G>
    );
    case 5: return (
      <G>{/* Auréole — pas d'animation de sous-élément, rendu statique */}
        <Ellipse cx="100" cy="16" rx="30" ry="9" fill="none" stroke="#FFD700" strokeWidth="6" />
      </G>
    );
    case 6: return (
      <G>{/* Antennes — traits couleur du corps */}
        <Line x1="82" y1="42" x2="74" y2="14" stroke={couleur} strokeWidth="4" strokeLinecap="round" />
        <Line x1="118" y1="42" x2="126" y2="14" stroke={couleur} strokeWidth="4" strokeLinecap="round" />
        <Circle cx="72" cy="11" r="7" fill="#EC4899" />
        <Circle cx="128" cy="11" r="7" fill="#06B6D4" />
      </G>
    );
    case 7: return (
      <G>{/* Bob */}
        <Path d="M62 46 Q62 18 100 18 Q138 18 138 46 Z" fill="#34D399" />
        <Path d="M50 46 Q100 62 150 46 Q150 55 100 57 Q50 55 50 46Z" fill="#10B981" />
      </G>
    );
    case 8: return (
      <G>{/* Casquette */}
        <Path d="M62 46 Q62 18 100 18 Q138 18 138 46 Z" fill="#EC4899" />
        <Rect x="38" y="42" width="28" height="9" rx="4" fill="#DB2777" />
        <Circle cx="100" cy="22" r="4" fill="#fff" />
      </G>
    );
    case 9: return (
      <SvgText x="136" y="60" fontSize="40">🍹</SvgText>
    ); // Cocktail
    default: return null;
  }
}

export default function Mascotte({ config, taille = 180, anime = true }) {
  const c = config || { creature: 0, tronche: 0, accessoire: 0, couleur: 0 };
  const couleur = COULEURS_MASCOTTE[c.couleur].valeur;

  const flotte = useSharedValue(0);
  const balance = useSharedValue(0);

  useEffect(() => {
    if (!anime) return;
    flotte.value = withRepeat(withSequence(
      withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      withTiming(6, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
    ), -1);
    balance.value = withRepeat(withSequence(
      withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
    ), -1);
  }, [anime]);

  const styleAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: flotte.value }, { rotate: `${balance.value}deg` }],
  }));

  return (
    <Animated.View style={anime ? styleAnim : null}>
      <Svg width={taille} height={taille} viewBox="0 0 200 205">
        {/* Ombre portée sous la mascotte */}
        <Ellipse cx="100" cy="197" rx="50" ry="8" fill="rgba(0,0,0,0.18)" />
        {/* Corps de la créature */}
        <Path d={CREATURES[c.creature].d} fill={couleur} stroke="rgba(42,27,71,0.22)" strokeWidth="3" />
        {/* Reflet brillant */}
        <Ellipse cx="122" cy="70" rx="13" ry="17" fill="rgba(255,255,255,0.18)" />
        {/* Expression */}
        {rendreTronche(c.tronche)}
        {/* Accessoire */}
        {rendreAccessoire(c.accessoire, couleur)}
      </Svg>
    </Animated.View>
  );
}
