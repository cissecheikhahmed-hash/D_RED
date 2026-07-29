import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getCurrentCoords } from '../lib/location';
import { supabase } from '../lib/supabase';

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  dred: '#a50606',
  success: '#1f9d55',
  border: '#e7e2d6',
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
type BloodGroup = (typeof BLOOD_GROUPS)[number];

const RADIUS_OPTIONS = [2, 5, 10, 25] as const;

function parseDayMonthYear(day: string, month: string, year: string): Date | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y || String(y).length !== 4) return null;
  const date = new Date(y, m - 1, d);
  const isValidCalendarDate =
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  return isValidCalendarDate ? date : null;
}

export function CampaignModal({
  visible,
  onClose,
  doctorId,
}: {
  visible: boolean;
  onClose: () => void;
  doctorId: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allGroups, setAllGroups] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<BloodGroup[]>([]);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [endDay, setEndDay] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [location, setLocation] = useState('');
  const [radiusKm, setRadiusKm] = useState<(typeof RADIUS_OPTIONS)[number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  function toggleGroup(group: BloodGroup) {
    setSelectedGroups((current) =>
      current.includes(group) ? current.filter((g) => g !== group) : [...current, group],
    );
  }

  function reset() {
    setTitle('');
    setDescription('');
    setAllGroups(true);
    setSelectedGroups([]);
    setDay('');
    setMonth('');
    setYear('');
    setEndDay('');
    setEndMonth('');
    setEndYear('');
    setLocation('');
    setRadiusKm(null);
    setMessage(null);
    setCreated(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setMessage('Indique un titre pour la campagne.');
      return;
    }
    if (!allGroups && selectedGroups.length === 0) {
      setMessage('Sélectionne au moins un groupe sanguin, ou "Tous les groupes".');
      return;
    }
    const scheduledDate = parseDayMonthYear(day, month, year);
    if (!scheduledDate) {
      setMessage('Date invalide (format JJ/MM/AAAA).');
      return;
    }
    const endDate = parseDayMonthYear(endDay, endMonth, endYear);
    if (!endDate) {
      setMessage('Date de fin invalide (format JJ/MM/AAAA).');
      return;
    }
    if (endDate < scheduledDate) {
      setMessage('La date de fin doit être après la date de la campagne.');
      return;
    }
    if (!location.trim()) {
      setMessage('Indique le lieu de la campagne.');
      return;
    }
    if (!radiusKm) {
      setMessage('Sélectionne un rayon de diffusion.');
      return;
    }

    setLoading(true);
    setMessage(null);

    const coords = await getCurrentCoords();
    if (!coords) {
      setMessage("Impossible d'obtenir ta position — autorise la localisation puis réessaie.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('campaigns').insert({
      title: title.trim(),
      description: description.trim() || null,
      blood_groups: allGroups ? null : selectedGroups,
      scheduled_at: scheduledDate.toISOString(),
      ends_at: endDate.toISOString(),
      location_label: location.trim(),
      origin_lat: coords.latitude,
      origin_lng: coords.longitude,
      radius_km: radiusKm,
      created_by: doctorId,
    });

    if (error) {
      // Erreur attendue tant que supabase/migrations/20260727_campaigns_and_emergency_alerts.sql
      // n'a pas été exécutée dans le projet Supabase.
      setMessage(`Erreur Supabase : ${error.message}`);
      setLoading(false);
      return;
    }

    setCreated(true);
    setLoading(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Campagne de don programmée</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Feather name="x" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          {created ? (
            <View style={styles.successWrap}>
              <Feather name="check-circle" size={28} color={colors.success} />
              <Text style={styles.successTitle}>Campagne créée</Text>
              <Text style={styles.helper}>
                Enregistrée dans Supabase (`campaigns`). La diffusion effective des notifications
                aux donneurs dans le rayon choisi n'est pas encore implémentée — voir la note de
                mise en œuvre.
              </Text>
              <Pressable style={styles.button} onPress={handleClose}>
                <Text style={styles.buttonText}>Fermer</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Titre de la campagne</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Collecte de rentrée"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.sectionLabel}>Description (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Précisions utiles pour les donneurs…"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.sectionLabel}>Groupes sanguins ciblés</Text>
              <Pressable style={styles.checkboxRow} onPress={() => setAllGroups((v) => !v)}>
                <View style={[styles.checkbox, allGroups && styles.checkboxChecked]} />
                <Text style={styles.checkboxLabel}>Tous les groupes</Text>
              </Pressable>
              {!allGroups && (
                <View style={styles.chipRow}>
                  {BLOOD_GROUPS.map((group) => (
                    <Pressable
                      key={group}
                      style={[styles.chip, selectedGroups.includes(group) && styles.chipSelected]}
                      onPress={() => toggleGroup(group)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedGroups.includes(group) && styles.chipTextSelected,
                        ]}
                      >
                        {group}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={styles.sectionLabel}>Date</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="JJ"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={day}
                  onChangeText={setDay}
                />
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={month}
                  onChangeText={setMonth}
                />
                <TextInput
                  style={[styles.input, styles.dateInput, styles.yearInput]}
                  placeholder="AAAA"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={year}
                  onChangeText={setYear}
                />
              </View>

              <Text style={styles.sectionLabel}>Date de fin</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="JJ"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={endDay}
                  onChangeText={setEndDay}
                />
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={endMonth}
                  onChangeText={setEndMonth}
                />
                <TextInput
                  style={[styles.input, styles.dateInput, styles.yearInput]}
                  placeholder="AAAA"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={endYear}
                  onChangeText={setEndYear}
                />
              </View>

              <Text style={styles.sectionLabel}>Lieu</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Place du Souvenir, Dakar"
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.sectionLabel}>Rayon de diffusion</Text>
              <View style={styles.chipRow}>
                {RADIUS_OPTIONS.map((km) => (
                  <Pressable
                    key={km}
                    style={[styles.chip, radiusKm === km && styles.chipSelected]}
                    onPress={() => setRadiusKm(km)}
                  >
                    <Text style={[styles.chipText, radiusKm === km && styles.chipTextSelected]}>
                      {km} km
                    </Text>
                  </Pressable>
                ))}
              </View>

              {message ? <Text style={styles.message}>{message}</Text> : null}

              <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? 'Création…' : 'Lancer la campagne'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 13, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontWeight: '600',
    color: colors.ink,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
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
    minHeight: 64,
    textAlignVertical: 'top',
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
    borderColor: colors.dred,
  },
  checkboxChecked: {
    backgroundColor: colors.dred,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.ink,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.dred,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.dred,
  },
  chipText: {
    color: colors.dred,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.white,
  },
  message: {
    textAlign: 'center',
    color: '#B45309',
  },
  button: {
    backgroundColor: colors.dred,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
  },
  successWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  helper: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 19,
  },
});
