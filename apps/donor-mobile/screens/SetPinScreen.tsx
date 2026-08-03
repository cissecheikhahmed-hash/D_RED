import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { hashPin, isValidPin } from '../lib/pin';
import { supabase } from '../lib/supabase';

// Affiché quand une session existe mais qu'aucun `pin_hash` n'est enregistré
// — normalement juste après l'inscription (le PIN est déjà collecté dans le
// formulaire d'inscription, mais la session n'existe qu'une fois l'OTP
// vérifié). Sert aussi de filet pour tout compte qui n'aurait pas encore de
// PIN pour une autre raison.
export function SetPinScreen() {
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!isValidPin(pin)) {
      setMessage('Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }
    if (pin.trim() !== pinConfirm.trim()) {
      setMessage('Les deux codes PIN ne correspondent pas.');
      return;
    }

    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ data: { pin_hash: hashPin(pin) } });
    // Pas d'action manuelle en cas de succès : updateUser déclenche
    // onAuthStateChange (USER_UPDATED), App.tsx bascule alors vers le
    // tableau de bord dès que pin_hash est présent dans la session.
    if (error) setMessage(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Définis ton code PIN</Text>
      <Text style={styles.subtitle}>
        Ce code te servira plus tard à déverrouiller ton dossier et ton pass QR. Il ne sert pas à
        te connecter.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Code PIN (4 chiffres)"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmer le PIN"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={4}
        value={pinConfirm}
        onChangeText={setPinConfirm}
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.button} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>Enregistrer</Text>
      </Pressable>

      {loading ? <ActivityIndicator style={styles.spinner} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#4b4b52',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#a50606',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    color: '#B45309',
  },
  spinner: {
    marginTop: 8,
  },
});
