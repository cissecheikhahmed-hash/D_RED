import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TrackingScreen } from './TrackingScreen';
import { supabase } from '../lib/supabase';
import type { EmergencyAlert } from './EmergencyFeedSection';

const colors = {
  dred: '#a50606',
  dredDark: '#7a0505',
  beige: '#f8efd7',
  white: '#ffffff',
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
};

// Vitesse moyenne supposée pour l'estimation de temps de trajet — vraie
// grossière (pas de routage réel), à ne pas présenter comme précise.
const ASSUMED_SPEED_KMH = 30;

function estimateMinutes(km: number): number {
  return Math.max(Math.round((km / ASSUMED_SPEED_KMH) * 60), 1);
}

export type DonorProfile = {
  firstName: string;
  lastName: string;
  bloodGroup: string;
  phone: string | null;
};

export function EmergencyMissionModal({
  alert,
  donorId,
  donorProfile,
  distanceKm,
  donorCoords,
  onClose,
  onAccepted,
}: {
  alert: EmergencyAlert | null;
  donorId: string;
  donorProfile: DonorProfile;
  distanceKm: number | null;
  donorCoords: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onAccepted: (emergencyId: string) => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setAccepted(false);
    setError(null);
    onClose();
  }

  async function handleAccept() {
    if (!alert) return;
    setLoading(true);
    setError(null);
    const { error: insertError } = await supabase.from('emergency_responses').insert({
      emergency_id: alert.id,
      donor_id: donorId,
      // Dénormalisé ici : le médecin (clé anon) ne peut pas lire les infos
      // d'un AUTRE utilisateur dans auth.users. Le donneur connaît les
      // siennes via sa propre session, donc on les capture au moment de la
      // réponse plutôt que d'exposer une clé service_role côté médecin.
      donor_first_name: donorProfile.firstName || null,
      donor_last_name: donorProfile.lastName || null,
      donor_blood_group: donorProfile.bloodGroup || null,
      donor_phone: donorProfile.phone,
      donor_lat: donorCoords?.latitude ?? null,
      donor_lng: donorCoords?.longitude ?? null,
    });
    // Contrainte unique (emergency_id, donor_id) : une réponse déjà
    // existante renvoie une erreur de conflit, traitée comme un succès.
    if (!insertError || insertError.code === '23505') {
      onAccepted(alert.id);
      setAccepted(true);
    } else {
      setError(`Erreur Supabase : ${insertError.message}`);
    }
    setLoading(false);
  }

  if (!alert) return null;

  if (accepted) {
    return (
      <TrackingScreen
        alert={alert}
        donorCoords={donorCoords}
        distanceKm={distanceKm}
        onDone={handleClose}
      />
    );
  }

  const groupsLabel = alert.blood_groups ? alert.blood_groups.join(' / ') : 'TOUS';
  const minutes = distanceKm !== null ? estimateMinutes(distanceKm) : null;

  return (
    <Modal visible animationType="slide" onRequestClose={handleClose}>
      <View style={styles.screen}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>URGENCE PRIORITAIRE</Text>
        </View>

        <View style={styles.centerWrap}>
          <View style={styles.groupCircle}>
            <Text style={styles.groupText}>{groupsLabel}</Text>
          </View>
          {alert.need_type && <Text style={styles.needType}>{alert.need_type}</Text>}
          <Text style={styles.title}>{alert.title ?? `Besoin urgent de poches ${groupsLabel}`}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={18} color={colors.dred} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoTitle}>{alert.location_label ?? 'Lieu non précisé'}</Text>
              {alert.description && <Text style={styles.infoSubtitle}>{alert.description}</Text>}
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '—'}
              </Text>
              <Text style={styles.metricLabel}>Distance</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{minutes !== null ? `≈ ${minutes} min` : '—'}</Text>
              <Text style={styles.metricLabel}>Temps estimé</Text>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={styles.acceptButton} onPress={handleAccept} disabled={loading}>
            <Text style={styles.acceptButtonText}>
              {loading ? 'Envoi…' : "J'accepte la mission"}
            </Text>
          </Pressable>
          <Pressable style={styles.refuseButton} onPress={handleClose} disabled={loading}>
            <Text style={styles.refuseButtonText}>Refuser</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dred,
    paddingTop: 56,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dredDark,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.beige,
  },
  badgeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  centerWrap: {
    alignItems: 'center',
    gap: 12,
  },
  groupCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dredDark,
  },
  groupText: {
    color: colors.white,
    fontSize: 44,
    fontWeight: '800',
  },
  needType: {
    color: colors.beige,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginHorizontal: -24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  infoSubtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.beige,
    borderRadius: 14,
    paddingVertical: 14,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
  },
  acceptButton: {
    backgroundColor: colors.beige,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.dred,
    fontWeight: '800',
    fontSize: 16,
  },
  refuseButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  refuseButtonText: {
    color: colors.inkSoft,
    fontWeight: '600',
    fontSize: 14,
  },
});
