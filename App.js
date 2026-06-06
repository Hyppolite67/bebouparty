// App.js
import React from 'react';
import { View, Text } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { COULEURS } from './src/theme/couleurs';

export default function App() {
  // useFonts renvoie false tant que les polices ne sont pas prêtes
  const [policesPretes] = useFonts({
    Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold,
    Baloo2_700Bold, Baloo2_800ExtraBold,
  });

  if (!policesPretes) {
    return <View style={{ flex: 1, backgroundColor: COULEURS.fondHaut }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COULEURS.fondHaut, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, color: COULEURS.jaune }}>
        BebouParty
      </Text>
    </View>
  );
}
