// src/composants/jeu/ChatDevinettes.js
// Panneau de chat pour les devineurs : liste des messages + saisie + bouton envoyer.
// Props :
//   messages  : [{ type: 'chat'|'found'|'close', pseudo, texte }]
//   onEnvoyer : (texte: string) => void
//   desactive : boolean — désactive la saisie (joueur a déjà trouvé)
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COULEURS } from '../../theme/couleurs';
import { POLICES, RAYONS } from '../../theme/styles';

// Rendu d'un message selon son type
function Message({ item }) {
  if (item.type === 'found') {
    return (
      <View style={[styles.bulle, styles.bulleFound]}>
        <Text style={[styles.texteMessage, styles.texteFound]}>
          ✓ <Text style={styles.pseudoFound}>{item.pseudo}</Text> a trouvé !
        </Text>
      </View>
    );
  }

  if (item.type === 'close') {
    return (
      <View style={[styles.bulle, styles.bulleClose]}>
        <Text style={[styles.texteMessage, styles.texteClose]}>
          🔥 <Text style={styles.pseudoClose}>{item.pseudo}</Text> : très proche !
        </Text>
      </View>
    );
  }

  // type 'chat' — message normal
  return (
    <View style={styles.bulle}>
      <Text style={styles.pseudoChat}>{item.pseudo} </Text>
      <Text style={styles.texteMessage}>{item.texte}</Text>
    </View>
  );
}

export default function ChatDevinettes({ messages, onEnvoyer, desactive }) {
  const [texte, setTexte] = useState('');
  const listeRef = useRef(null);

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    if (listeRef.current && messages && messages.length > 0) {
      setTimeout(() => {
        listeRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [messages]);

  const envoyer = () => {
    const t = texte.trim();
    if (!t || desactive) return;
    onEnvoyer(t);
    setTexte('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.conteneur}
    >
      {/* Zone de messages */}
      <FlatList
        ref={listeRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <Message item={item} />}
        style={styles.liste}
        contentContainerStyle={styles.listeContenu}
        showsVerticalScrollIndicator={false}
        // maintenir le scroll en bas
        onContentSizeChange={() => listeRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Zone de saisie */}
      <View style={[styles.saisieZone, desactive && styles.saisieDesactivee]}>
        <TextInput
          style={styles.input}
          value={texte}
          onChangeText={setTexte}
          placeholder={desactive ? 'Tu as déjà trouvé !' : 'Tape ta réponse…'}
          placeholderTextColor="rgba(255,255,255,0.35)"
          onSubmitEditing={envoyer}
          returnKeyType="send"
          editable={!desactive}
          maxLength={60}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={envoyer}
          style={[styles.boutonEnvoyer, (!texte.trim() || desactive) && styles.boutonDesactive]}
          activeOpacity={0.8}
          disabled={!texte.trim() || desactive}
        >
          <Text style={styles.texteBouton}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: 'rgba(43,27,71,0.38)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: RAYONS.carte,
    overflow: 'hidden',
  },

  liste: {
    flex: 1,
  },
  listeContenu: {
    padding: 8,
    gap: 4,
  },

  // Bulle de message
  bulle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RAYONS.petit,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bulleFound: {
    backgroundColor: 'rgba(34,197,94,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.45)',
  },
  bulleClose: {
    backgroundColor: 'rgba(255,159,69,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,159,69,0.45)',
  },

  texteMessage: {
    fontFamily: POLICES.texte,
    fontSize: 13,
    color: COULEURS.texteDoux,
    flexShrink: 1,
  },
  texteFound: {
    color: '#4ADE80',
    fontFamily: POLICES.texteGras,
  },
  texteClose: {
    color: '#FFA040',
    fontFamily: POLICES.texteGras,
  },
  pseudoChat: {
    fontFamily: POLICES.texteGras,
    fontSize: 13,
    color: COULEURS.blanc,
  },
  pseudoFound: {
    fontFamily: POLICES.texteGras,
    color: '#4ADE80',
  },
  pseudoClose: {
    fontFamily: POLICES.texteGras,
    color: '#FFA040',
  },

  // Saisie
  saisieZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(43,27,71,0.6)',
  },
  saisieDesactivee: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: POLICES.texte,
    fontSize: 14,
    color: COULEURS.blanc,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  boutonEnvoyer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COULEURS.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonDesactive: {
    backgroundColor: 'rgba(139,92,246,0.35)',
  },
  texteBouton: {
    fontSize: 16,
    color: COULEURS.blanc,
  },
});
