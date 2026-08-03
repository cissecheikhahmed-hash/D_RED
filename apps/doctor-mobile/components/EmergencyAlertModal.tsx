import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import type { HospitalProfile } from '../lib/hospital';

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  beige: '#f8efd7',
  dred: '#a50606',
  success: '#1f9d55',
  border: '#e7e2d6',
};

const FIXED_RADIUS_KM = 10;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
type BloodGroup = (typeof BLOOD_GROUPS)[number];

const DURATION_OPTIONS = [
  { label: '6 h', hours: 6 },
  { label: '12 h', hours: 12 },
  { label: '24 h', hours: 24 },
  { label: '48 h', hours: 48 },
] as const;

const NEED_TYPES = ['Sang Total', 'Plasma', 'Plaquettes'] as const;

export function EmergencyAlertModal({
  visible,
  onClose,
  doctorId,
  hospital,
}: {
  visible: boolean;
  onClose: () => void;
  doctorId: string;
  hospital: HospitalProfile | null;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allGroups, setAllGroups] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<BloodGroup[]>([]);
  const [needType, setNeedType] = useState<(typeof NEED_TYPES)[number] | null>(null);
  const [units, setUnits] = useState('');
  const [durationHours, setDurationHours] = useState<number | null>(null);
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
    setAllGroups(false);
    setSelectedGroups([]);
    setNeedType(null);
    setUnits('');
    setDurationHours(null);
    setMessage(null);
    setCreated(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!hospital) {
      setMessage(
        "Ton compte n'a pas de fiche établissement configurée — contacte le CNTS pour la faire renseigner.",
      );
      return;
    }
    if (!allGroups && selectedGroups.length === 0) {
      setMessage('Sélectionne au moins un groupe sanguin, ou "Tous groupes compatibles".');
      return;
    }
    const unitsNumber = Number(units);
    if (!unitsNumber || unitsNumber <= 0) {
      setMessage('Indique un nombre de poches valide.');
      return;
    }
    if (!durationHours) {
      setMessage("Sélectionne la durée de validité de l'alerte.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    const groupsLabel = allGroups ? 'tous groupes' : selectedGroups.join('/');
    const defaultTitle = `Besoin urgent de poches ${groupsLabel}`;

    // `blood_group` (singulier) n'est plus renseigné : remplacé par
    // `blood_groups` (tableau, null = tous groupes compatibles), sur le
    // même modèle que campaigns.blood_groups.
    const { error } = await supabase.from('emergency_alerts').insert({
      title: title.trim() || defaultTitle,
      description: description.trim() || null,
      location_label: hospital.name,
      blood_groups: allGroups ? null : selectedGroups,
      need_type: needType,
      units_needed: unitsNumber,
      radius_km: FIXED_RADIUS_KM,
      origin_lat: hospital.lat,
      origin_lng: hospital.lng,
      ends_at: endsAt.toISOString(),
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
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Alerte d'urgence vitale</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Feather name="x" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          {created ? (
            <View style={styles.successWrap}>
              <Feather name="check-circle" size={28} color={colors.success} />
              <Text style={styles.successTitle}>Alerte envoyée</Text>
              <Text style={styles.helper}>
                Enregistrée dans Supabase (`emergency_alerts`), rayon fixe {FIXED_RADIUS_KM} km.
                La notification push et l'envoi SMS aux donneurs concernés ne sont pas encore
                câblés (modèle de données prêt, traitement serveur à construire) — voir la note
                de mise en œuvre.
              </Text>
              <Pressable style={styles.button} onPress={handleClose}>
                <Text style={styles.buttonText}>Fermer</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Titre (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Besoin urgent de poches O-"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.sectionLabel}>Lieu</Text>
              <View style={styles.hospitalCard}>
                <Feather name="map-pin" size={16} color={colors.dred} />
                <View style={styles.hospitalTextWrap}>
                  <Text style={styles.hospitalName}>
                    {hospital ? hospital.name : 'Aucun établissement configuré'}
                  </Text>
                  {hospital?.address && <Text style={styles.hospitalAddress}>{hospital.address}</Text>}
                </View>
              </View>

              <Text style={styles.sectionLabel}>Description (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Précisions utiles pour les donneurs…"
                multiline
                numberOfLines={2}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.sectionLabel}>Groupe(s) sanguin(s) requis</Text>
              <Pressable style={styles.checkboxRow} onPress={() => setAllGroups((v) => !v)}>
                <View style={[styles.checkbox, allGroups && styles.checkboxChecked]} />
                <Text style={styles.checkboxLabel}>Tous groupes compatibles</Text>
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

              <Text style={styles.sectionLabel}>Type de besoin (optionnel)</Text>
              <View style={styles.chipRow}>
                {NEED_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.chip, needType === type && styles.chipSelected]}
                    onPress={() => setNeedType(needType === type ? null : type)}
                  >
                    <Text style={[styles.chipText, needType === type && styles.chipTextSelected]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Nombre de poches nécessaires</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 2"
                keyboardType="number-pad"
                value={units}
                onChangeText={setUnits}
              />

              <Text style={styles.sectionLabel}>Validité de l'alerte</Text>
              <View style={styles.chipRow}>
                {DURATION_OPTIONS.map(({ label, hours }) => (
                  <Pressable
                    key={hours}
                    style={[styles.chip, durationHours === hours && styles.chipSelected]}
                    onPress={() => setDurationHours(hours)}
                  >
                    <Text
                      style={[styles.chipText, durationHours === hours && styles.chipTextSelected]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.radiusNote}>
                <Feather name="map-pin" size={14} color={colors.inkSoft} />
                <Text style={styles.radiusNoteText}>
                  Rayon fixe : {FIXED_RADIUS_KM} km autour de l'établissement
                </Text>
              </View>

              {message ? <Text style={styles.message}>{message}</Text> : null}

              <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Envoi…' : "Envoyer l'alerte"}</Text>
              </Pressable>
            </>
          )}
        </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.beige,
    borderRadius: 12,
    padding: 12,
  },
  hospitalTextWrap: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  hospitalAddress: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  textArea: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  radiusNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radiusNoteText: {
    fontSize: 12,
    color: colors.inkSoft,
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
