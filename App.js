// App.js
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { FournisseurJoueur } from './src/etat/ContexteJoueur';
import Navigation from './src/navigation/Navigation';
import { COULEURS } from './src/theme/couleurs';

export default function App() {
  const [policesPretes] = useFonts({ Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold });
  if (!policesPretes) return <View style={{ flex: 1, backgroundColor: COULEURS.fondHaut }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FournisseurJoueur>
          <Navigation />
        </FournisseurJoueur>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
