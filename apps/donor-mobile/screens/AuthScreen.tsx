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
import { hashPin, isValidPin } from '../lib/pin';
import { supabase } from '../lib/supabase';

const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const OTP_PATTERN = /^\d{6}$/;
const MIN_AGE = 18;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
type BloodGroup = (typeof BLOOD_GROUPS)[number];

const SEXES = [
  { value: 'F', label: 'Femme' },
  { value: 'M', label: 'Homme' },
] as const;
export type Sex = (typeof SEXES)[number]['value'];

function normalizePhone(phone: string): string {
  return phone.trim().replace(/[^\d+]/g, '');
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

type Step = 'form' | 'pin' | 'otp';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [signInPin, setSignInPin] = useState('');
  const [otpCode, setOtpCode] = useState('');

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
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  function switchMode(next: 'signin' | 'signup') {
    setMessage(null);
    setStep('form');
    setSignInPin('');
    setOtpCode('');
    setMode(next);
  }

  function handleContinueSignIn() {
    const cleanPhone = normalizePhone(phone);
    if (!PHONE_PATTERN.test(cleanPhone)) {
      setMessage('Numéro invalide — utilise le format international (ex : +221771234567).');
      return;
    }
    setMessage(null);
    setStep('pin');
  }

  async function handleVerifyPinAndSendOtp() {
    if (!isValidPin(signInPin)) {
      setMessage('Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }

    setLoading(true);
    setMessage(null);
    const cleanPhone = normalizePhone(phone);

    // Le PIN est vérifié côté serveur AVANT d'envoyer le moindre SMS — sans
    // ça, n'importe qui pourrait harceler le numéro de quelqu'un d'autre en
    // le tapant sur cet écran. Message volontairement générique dans tous
    // les cas d'échec (numéro inconnu ou mauvais PIN), pour ne pas révéler
    // quels numéros ont un compte.
    const { data: pinOk, error: pinError } = await supabase.rpc('verify_signin_pin', {
      p_phone: cleanPhone,
      p_pin_hash: hashPin(signInPin),
    });

    if (pinError || !pinOk) {
      setMessage('Numéro ou code PIN incorrect.');
      setLoading(false);
      return;
    }

    // shouldCreateUser: false — sans ça, Supabase crée silencieusement un
    // compte vide (sans aucun profil) pour n'importe quel numéro inconnu
    // saisi ici par erreur, au lieu d'inviter à s'inscrire. C'est
    // exactement ce qui a produit des comptes avec un profil vide.
    const { error } = await supabase.auth.signInWithOtp({
      phone: cleanPhone,
      options: { shouldCreateUser: false },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  }

  async function handleVerifyOtpSignIn() {
    if (!OTP_PATTERN.test(otpCode)) {
      setMessage('Le code reçu par SMS contient 6 chiffres.');
      return;
    }

    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: otpCode,
      type: 'sms',
    });
    // Pas d'action manuelle en cas de succès : le listener onAuthStateChange
    // de App.tsx détecte la nouvelle session et bascule vers le tableau de
    // bord (ou l'écran de définition du PIN si aucun n'est encore enregistré).
    if (error) setMessage(error.message);
    setLoading(false);
  }

  async function handleSendOtpSignUp() {
    const cleanPhone = normalizePhone(phone);
    if (!PHONE_PATTERN.test(cleanPhone)) {
      setMessage('Numéro invalide — utilise le format international (ex : +221771234567).');
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

    if (!isValidPin(pin)) {
      setMessage('Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }
    if (pin !== pinConfirm) {
      setMessage('Les deux codes PIN ne correspondent pas.');
      return;
    }

    setLoading(true);
    setMessage(null);
    // Le profil n'est volontairement PAS transmis ici via `options.data` :
    // pour l'inscription par téléphone, ce champ ne s'attache pas de façon
    // fiable au nouvel utilisateur (contrairement à `signUp` par email). On
    // le renseigne juste après, via `updateUser`, dans
    // handleVerifyOtpSignUp — le même mécanisme que celui déjà utilisé (et
    // vérifié fiable) pour `pin_hash`.
    const { error } = await supabase.auth.signInWithOtp({ phone: cleanPhone });

    if (error) {
      setMessage(error.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  }

  async function handleVerifyOtpSignUp() {
    if (!OTP_PATTERN.test(otpCode)) {
      setMessage('Le code reçu par SMS contient 6 chiffres.');
      return;
    }

    setLoading(true);
    setMessage(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: otpCode,
      type: 'sms',
    });
    if (verifyError) {
      setMessage(verifyError.message);
      setLoading(false);
      return;
    }

    // Le profil est enregistré ici, une fois la session confirmée — pas via
    // `options.data` de signInWithOtp (ne s'attache pas de façon fiable pour
    // l'inscription par téléphone). App.tsx bascule automatiquement vers le
    // tableau de bord dès que la session (avec ce profil) existe.
    const birthDate = parseDayMonthYear(birthDay, birthMonth, birthYear);
    const lastDonationDate = !isFirstDonation
      ? parseDayMonthYear(lastDonationDay, lastDonationMonth, lastDonationYear)
      : null;

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: birthDate ? birthDate.toISOString().slice(0, 10) : null,
        blood_group: bloodGroup,
        medical_history: medicalHistory.trim() || null,
        sex,
        last_donation_date: lastDonationDate ? lastDonationDate.toISOString().slice(0, 10) : null,
        pin_hash: hashPin(pin),
      },
    });
    if (updateError) setMessage(updateError.message);
    setLoading(false);
  }

  if (step === 'pin') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Code PIN</Text>
        <Text style={styles.subtitle}>
          Confirme ton code PIN avant l'envoi du SMS — ça évite qu'on puisse t'envoyer des SMS en
          tapant juste ton numéro.
        </Text>

        <TextInput
          style={[styles.input, styles.otpInput]}
          placeholder="0000"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={signInPin}
          onChangeText={setSignInPin}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={styles.button} onPress={handleVerifyPinAndSendOtp} disabled={loading}>
          <Text style={styles.buttonText}>Recevoir le code par SMS</Text>
        </Pressable>
        <Pressable
          style={styles.buttonSecondary}
          onPress={() => {
            setMessage(null);
            setStep('form');
          }}
          disabled={loading}
        >
          <Text style={styles.buttonSecondaryText}>Modifier le numéro</Text>
        </Pressable>

        {loading ? <ActivityIndicator style={styles.spinner} /> : null}
      </View>
    );
  }

  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Vérification du numéro</Text>
        <Text style={styles.subtitle}>Code envoyé par SMS au {phone}</Text>

        <TextInput
          style={[styles.input, styles.otpInput]}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={otpCode}
          onChangeText={setOtpCode}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable
          style={styles.button}
          onPress={mode === 'signup' ? handleVerifyOtpSignUp : handleVerifyOtpSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Valider le code</Text>
        </Pressable>
        <Pressable
          style={styles.buttonSecondary}
          onPress={() => {
            setMessage(null);
            setStep(mode === 'signin' ? 'pin' : 'form');
          }}
          disabled={loading}
        >
          <Text style={styles.buttonSecondaryText}>
            {mode === 'signin' ? 'Modifier le PIN' : 'Modifier le numéro'}
          </Text>
        </Pressable>

        {loading ? <ActivityIndicator style={styles.spinner} /> : null}
      </View>
    );
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
          placeholder="Téléphone (ex : +221771234567)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
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
        <Pressable style={styles.checkboxRow} onPress={() => setIsFirstDonation((value) => !value)}>
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

        <Text style={styles.sectionLabel}>
          Code PIN (4 chiffres) — verrou local, ne sert pas à se connecter
        </Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="Code PIN"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={4}
            value={pin}
            onChangeText={setPin}
          />
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="Confirmer le PIN"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={4}
            value={pinConfirm}
            onChangeText={setPinConfirm}
          />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={styles.button} onPress={handleSendOtpSignUp} disabled={loading}>
          <Text style={styles.buttonText}>Recevoir le code par SMS</Text>
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
      <Text style={styles.subtitle}>Connexion par code SMS, sans mot de passe.</Text>

      <TextInput
        style={styles.input}
        placeholder="Téléphone (ex : +221771234567)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.button} onPress={handleContinueSignIn} disabled={loading}>
        <Text style={styles.buttonText}>Continuer</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#4b4b52',
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
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
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
