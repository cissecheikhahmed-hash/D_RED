import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { hashPin, isValidPin } from '../lib/pin';

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  dred: '#a50606',
  border: '#e7e2d6',
};

// Vérification 100% locale : le donneur a déjà une session valide, et
// `pin_hash` est déjà présent dans ses propres user_metadata (accessible
// côté client, contrairement à celui d'un autre utilisateur). Aucun appel
// réseau n'est nécessaire ici, contrairement à la vérification du PIN à la
// connexion (qui doit, elle, être faite côté serveur avant authentification).
export function PinPromptModal({
  visible,
  storedPinHash,
  onCancel,
  onSuccess,
}: {
  visible: boolean;
  storedPinHash: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    setPin('');
    setMessage(null);
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  function handleConfirm() {
    if (!isValidPin(pin)) {
      setMessage('Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }
    if (!storedPinHash || hashPin(pin) !== storedPinHash) {
      setMessage('Code PIN incorrect.');
      return;
    }
    reset();
    onSuccess();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Code PIN requis</Text>
          <Text style={styles.subtitle}>Confirme ton code pour afficher ton pass donneur.</Text>

          <TextInput
            style={styles.input}
            placeholder="0000"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={4}
            value={pin}
            onChangeText={setPin}
            autoFocus
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable style={styles.button} onPress={handleConfirm}>
            <Text style={styles.buttonText}>Confirmer</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={handleCancel}>
            <Text style={styles.buttonSecondaryText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 13, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    width: 140,
  },
  message: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.dred,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
  },
  buttonSecondary: {
    paddingVertical: 8,
  },
  buttonSecondaryText: {
    color: colors.inkSoft,
    fontWeight: '600',
  },
});
