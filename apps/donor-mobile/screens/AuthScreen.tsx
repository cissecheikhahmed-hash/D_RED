import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MIN_AGE = 18;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
type BloodGroup = (typeof BLOOD_GROUPS)[number];

const SEXES = [
  { value: 'F', label: 'Femme' },
  { value: 'M', label: 'Homme' },
] as const;
export type Sex = (typeof SEXES)[number]['value'];

function validateEmailAndPassword(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email)) return 'Adresse email invalide.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  return null;
}

function parseDayMonthYear(day: string, month: string, year: string): Date | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y || String(y).length !== 4) return null;

  const date = new Date(y, m - 1, d);
  const isValidCalendarDate =
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  if (!isValidCalendarDate) return null;
  if (date > new Date()) return null;
  return date;
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [isFirstDonation, setIsFirstDonation] = useState(true);
  const [lastDonationDay, setLastDonationDay] = useState('');
  const [lastDonationMonth, setLastDonationMonth] = useState('');
  const [lastDonationYear, setLastDonationYear] = useState('');

  function switchMode(next: 'signin' | 'signup') {
    setMessage(null);
    setMode(next);
  }

  async function handleSignIn() {
    const cleanEmail = email.trim().toLowerCase();
    const validationError = validateEmailAndPassword(cleanEmail, password);
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

  async function handleSignUp() {
    const cleanEmail = email.trim().toLowerCase();
    const credentialsError = validateEmailAndPassword(cleanEmail, password);
    if (credentialsError) {
      setMessage(credentialsError);
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setMessage('Merci de renseigner ton prénom et ton nom.');
      return;
    }

    const birthDate = parseDayMonthYear(birthDay, birthMonth, birthYear);
    if (!birthDate) {
      setMessage('Date de naissance invalide (format JJ/MM/AAAA).');
      return;
    }
    if (calculateAge(birthDate) < MIN_AGE) {
      setMessage(`Il faut avoir au moins ${MIN_AGE} ans pour donner son sang.`);
      return;
    }

    if (!bloodGroup) {
      setMessage('Merci de sélectionner ton groupe sanguin.');
      return;
    }
    if (!sex) {
      setMessage('Merci de sélectionner ton sexe.');
      return;
    }

    let lastDonationDate: Date | null = null;
    if (!isFirstDonation) {
      lastDonationDate = parseDayMonthYear(lastDonationDay, lastDonationMonth, lastDonationYear);
      if (!lastDonationDate) {
        setMessage('Date du dernier don invalide (format JJ/MM/AAAA).');
        return;
      }
    }

    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: birthDate.toISOString().slice(0, 10),
          blood_group: bloodGroup,
          medical_history: medicalHistory.trim() || null,
          sex,
          last_donation_date: lastDonationDate ? lastDonationDate.toISOString().slice(0, 10) : null,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // signUp renvoie déjà la session si la confirmation d'email est
    // désactivée côté Supabase ; on revérifie explicitement au cas où pour
    // ne jamais laisser l'utilisateur bloqué sur ce formulaire. Dans les
    // deux cas, c'est le listener onAuthStateChange de App.tsx qui déclenche
    // la bascule vers le tableau de bord dès qu'une session existe.
    const activeSession = data.session ?? (await supabase.auth.getSession()).data.session;

    if (!activeSession) {
      // Confirmation d'email requise : pas de session tant qu'elle n'est
      // pas validée. On repasse en mode connexion (au lieu de laisser le
      // bouton "Créer mon compte" cliquable) pour éviter l'erreur
      // "User already registered" si l'utilisateur retente l'inscription.
      setMessage('Compte créé — confirme ton email avant de te connecter, puis connecte-toi ci-dessous.');
      setMode('signin');
    }
    setLoading(false);
  }

  if (mode === 'signup') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Créer un compte donneur</Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="Prénom"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="Nom"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
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

        <Text style={styles.sectionLabel}>Date de naissance</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="JJ"
            keyboardType="number-pad"
            maxLength={2}
            value={birthDay}
            onChangeText={setBirthDay}
          />
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="MM"
            keyboardType="number-pad"
            maxLength={2}
            value={birthMonth}
            onChangeText={setBirthMonth}
          />
          <TextInput
            style={[styles.input, styles.dateInput, styles.yearInput]}
            placeholder="AAAA"
            keyboardType="number-pad"
            maxLength={4}
            value={birthYear}
            onChangeText={setBirthYear}
          />
        </View>

        <Text style={styles.sectionLabel}>Groupe sanguin</Text>
        <View style={styles.chipRow}>
          {BLOOD_GROUPS.map((group) => (
            <Pressable
              key={group}
              style={[styles.chip, bloodGroup === group && styles.chipSelected]}
              onPress={() => setBloodGroup(group)}
            >
              <Text style={[styles.chipText, bloodGroup === group && styles.chipTextSelected]}>
                {group}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Sexe</Text>
        <View style={styles.chipRow}>
          {SEXES.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[styles.chip, sex === value && styles.chipSelected]}
              onPress={() => setSex(value)}
            >
              <Text style={[styles.chipText, sex === value && styles.chipTextSelected]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Dernier don de sang</Text>
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setIsFirstDonation((value) => !value)}
        >
          <View style={[styles.checkbox, isFirstDonation && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>C'est mon premier don</Text>
        </Pressable>
        {!isFirstDonation && (
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="JJ"
              keyboardType="number-pad"
              maxLength={2}
              value={lastDonationDay}
              onChangeText={setLastDonationDay}
            />
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="MM"
              keyboardType="number-pad"
              maxLength={2}
              value={lastDonationMonth}
              onChangeText={setLastDonationMonth}
            />
            <TextInput
              style={[styles.input, styles.dateInput, styles.yearInput]}
              placeholder="AAAA"
              keyboardType="number-pad"
              maxLength={4}
              value={lastDonationYear}
              onChangeText={setLastDonationYear}
            />
          </View>
        )}

        <Text style={styles.sectionLabel}>Antécédents / maladies connues (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ex : diabète, hypertension…"
          multiline
          numberOfLines={3}
          value={medicalHistory}
          onChangeText={setMedicalHistory}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={styles.button} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.buttonText}>Créer mon compte</Text>
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={() => switchMode('signin')} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>J'ai déjà un compte</Text>
        </Pressable>

        {loading ? <ActivityIndicator style={styles.spinner} /> : null}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>D.RED — Donneur</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
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
      <Pressable style={styles.buttonSecondary} onPress={() => switchMode('signup')} disabled={loading}>
        <Text style={styles.buttonSecondaryText}>Créer un compte</Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 48,
    backgroundColor: '#fff',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontWeight: '600',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowInput: {
    flex: 1,
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
  },
  yearInput: {
    flex: 1.4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#a50606',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#a50606',
  },
  chipText: {
    color: '#a50606',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a50606',
  },
  checkboxChecked: {
    backgroundColor: '#a50606',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1c1c1f',
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
  buttonSecondary: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#a50606',
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
