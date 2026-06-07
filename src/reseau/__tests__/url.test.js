// Tests de la construction d'URL WebSocket à partir de ce que l'utilisateur saisit.
import { construireUrl } from '../ClientReseau';

test('IP locale avec port -> ws://', () => {
  expect(construireUrl('192.168.1.20:8080')).toBe('ws://192.168.1.20:8080');
});

test('domaine cloud seul -> wss://', () => {
  expect(construireUrl('bebouparty.onrender.com')).toBe('wss://bebouparty.onrender.com');
});

test('URL https collée -> wss://', () => {
  expect(construireUrl('https://bebouparty.onrender.com')).toBe('wss://bebouparty.onrender.com');
});

test('URL ws:// ou wss:// déjà complète -> inchangée', () => {
  expect(construireUrl('ws://10.0.0.5:8080')).toBe('ws://10.0.0.5:8080');
  expect(construireUrl('wss://exemple.com')).toBe('wss://exemple.com');
});

test('espaces et slash final sont nettoyés', () => {
  expect(construireUrl('  https://exemple.com/  ')).toBe('wss://exemple.com');
});
