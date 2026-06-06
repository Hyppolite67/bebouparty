// src/etat/ContexteJoueur.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MASCOTTE_DEFAUT } from '../donnees/mascotte';

const Contexte = createContext(null);
const CLE = '@bebou_profil';

export function FournisseurJoueur({ children }) {
  const [pseudo, setPseudo] = useState('');
  const [mascotte, setMascotte] = useState(MASCOTTE_DEFAUT);
  const [adresseServeur, setAdresseServeur] = useState('192.168.1.10:8080');

  // Recharger le dernier profil au démarrage
  useEffect(() => {
    AsyncStorage.getItem(CLE).then((txt) => {
      if (!txt) return;
      try {
        const p = JSON.parse(txt);
        if (p.pseudo) setPseudo(p.pseudo);
        if (p.mascotte) setMascotte(p.mascotte);
        if (p.adresseServeur) setAdresseServeur(p.adresseServeur);
      } catch {}
    });
  }, []);

  const sauverProfil = () => AsyncStorage.setItem(CLE, JSON.stringify({ pseudo, mascotte, adresseServeur }));

  const valeur = { pseudo, setPseudo, mascotte, setMascotte, adresseServeur, setAdresseServeur, sauverProfil, profil: { pseudo, mascotte } };
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useJoueur() { return useContext(Contexte); }
