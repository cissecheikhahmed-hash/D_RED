import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Compte créé par apps/doctor-mobile/scripts/create-demo-account.mjs.
// __DEV__ exclut ce bouton de tout build de production — des identifiants
// en dur ne doivent jamais être accessibles dans une app publiée.
const DEMO_EMAIL = 'demo.cnts@d-red.test';
const DEMO_PASSWORD = 'DemoCnts2026!';

function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email)) return 'Adresse email invalide.';
  if (!password) return 'Mot de passe requis.';
  return null;
}

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignIn() {
    const cleanEmail = email.trim().toLowerCase();
    const validationError = validateCredentials(cleanEmail, password);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) setMessage(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Feather name="shield" size={22} color="#ffffff" />
      </View>
      <Text style={styles.title}>D.RED — Espace médical</Text>
      <Text style={styles.subtitle}>Réservé au personnel habilité (hôpital, CNTS).</Text>

      <TextInput
        style={styles.input}
        placeholder="Email professionnel"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.button} onPress={handleSignIn} disabled={loading}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </Pressable>

      {__DEV__ && (
        <Pressable
          style={styles.demoButton}
          onPress={() => {
            setEmail(DEMO_EMAIL);
            setPassword(DEMO_PASSWORD);
          }}
        >
          <Text style={styles.demoButtonText}>Remplir avec le compte démo</Text>
        </Pressable>
      )}

      {loading ? <ActivityIndicator style={styles.spinner} /> : null}

      <Text style={styles.footnote}>
        Les comptes médecin/CNTS sont créés par un administrateur — il n'y a pas d'inscription
        libre depuis cette app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  badge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#a50606',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0b0b0d',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#4b4b52',
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
    color: '#ffffff',
    fontWeight: '600',
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  demoButtonText: {
    fontSize: 12,
    color: '#4b4b52',
    textDecorationLine: 'underline',
  },
  message: {
    textAlign: 'center',
    color: '#B45309',
  },
  spinner: {
    marginTop: 8,
  },
  footnote: {
    fontSize: 12,
    color: '#4b4b52',
    textAlign: 'center',
    marginTop: 16,
  },
});
