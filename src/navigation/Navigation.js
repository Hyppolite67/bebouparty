// src/navigation/Navigation.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EcranAccueil from '../ecrans/EcranAccueil';
import EcranProfil from '../ecrans/EcranProfil';
import EcranSalleAttente from '../ecrans/EcranSalleAttente';
import EcranSelectionJeu from '../ecrans/EcranSelectionJeu';
import EcranAttenteJeu from '../ecrans/EcranAttenteJeu';
import EcranJeuDessin from '../ecrans/EcranJeuDessin';

const Pile = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Pile.Navigator screenOptions={{ headerShown: false }}>
        <Pile.Screen name="Accueil" component={EcranAccueil} />
        <Pile.Screen name="Profil" component={EcranProfil} />
        <Pile.Screen name="SalleAttente" component={EcranSalleAttente} />
        <Pile.Screen name="SelectionJeu" component={EcranSelectionJeu} />
        <Pile.Screen name="AttenteJeu" component={EcranAttenteJeu} />
        <Pile.Screen name="JeuDessin" component={EcranJeuDessin} />
      </Pile.Navigator>
    </NavigationContainer>
  );
}
