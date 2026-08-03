import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmergencyMissionModal, type DonorProfile } from './EmergencyMissionModal';
import { distanceKm } from '../lib/distance';
import { supabase } from '../lib/supabase';

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  beige: '#f8efd7',
  dred: '#a50606',
  success: '#1f9d55',
  border: '#e7e2d6',
};

export type EmergencyAlert = {
  id: string;
  title: string | null;
  description: string | null;
  location_label: string | null;
  blood_groups: string[] | null;
  need_type: string | null;
  units_needed: number;
  radius_km: number;
  origin_lat: number;
  origin_lng: number;
};

const SELECT_COLUMNS =
  'id, title, description, location_label, blood_groups, need_type, units_needed, radius_km, origin_lat, origin_lng';

export function EmergencyFeedSection({
  donorId,
  donorProfile,
  bloodGroup,
  coords,
}: {
  donorId: string;
  donorProfile: DonorProfile;
  bloodGroup: string;
  coords: { latitude: number; longitude: number } | null;
}) {
  const [alerts, setAlerts] = useState<EmergencyAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);

  async function fetchAlerts() {
    const nowIso = new Date().toISOString();
    // Volontairement AUCUN filtre sur la distance ici : le rayon sert
    // uniquement à trier/afficher côté donneur, jamais à masquer une
    // alerte active (un filtrage strict avait déjà causé un bug de ce
    // type). Le groupe sanguin, lui, EST filtré ci-dessous (sorted) — choix
    // explicite du 2026-07-30 qui remplace la décision précédente ("badge
    // seulement, jamais masqué") : un donneur ne doit voir que les urgences
    // dont le(s) groupe(s) demandé(s) correspond(ent) au sien.
    const { data, error: fetchError } = await supabase
      .from('emergency_alerts')
      .select(SELECT_COLUMNS)
      .eq('status', 'OPEN')
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`);

    if (fetchError) {
      // Attendu tant que les migrations campaigns_and_emergency_alerts /
      // campaigns_emergency_v2 / emergency_multi_group_realtime n'ont pas
      // été exécutées sur ce projet.
      setError(fetchError.message);
      return;
    }
    setAlerts(data ?? []);
  }

  useEffect(() => {
    fetchAlerts();

    (async () => {
      const { data } = await supabase
        .from('emergency_responses')
        .select('emergency_id')
        .eq('donor_id', donorId);
      if (data) setRespondedIds(new Set(data.map((r) => r.emergency_id)));
    })();

    // Realtime : dès qu'une alerte est créée/modifiée/supprimée, on
    // re-synchronise — c'est ce qui rend l'affichage "instantané" côté
    // donneur au lieu d'attendre un remontage de l'écran.
    const channel = supabase
      .channel('emergency_alerts_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_alerts' },
        () => fetchAlerts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [donorId]);

  if (error) return null;
  if (alerts === null) return null;

  const sorted = alerts
    // Groupe incompatible avec la demande du médecin = masqué entièrement,
    // pas juste un badge en moins (choix explicite du 2026-07-30).
    .filter((alert) => !alert.blood_groups || alert.blood_groups.includes(bloodGroup))
    .map((alert) => {
      const distance = coords
        ? distanceKm(coords, { latitude: alert.origin_lat, longitude: alert.origin_lng })
        : null;
      return { alert, distance };
    })
    .sort((a, b) => {
      if (a.distance === null || b.distance === null) return 0;
      return a.distance - b.distance;
    });

  if (sorted.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Urgences près de toi</Text>
      {sorted.map(({ alert, distance }) => {
        const responded = respondedIds.has(alert.id);
        const groupsLabel = alert.blood_groups ? alert.blood_groups.join(', ') : 'Tous groupes';
        return (
          <View key={alert.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.urgentBadge}>
                <Feather name="alert-circle" size={12} color={colors.white} />
                <Text style={styles.urgentBadgeText}>{groupsLabel}</Text>
              </View>
              <View style={styles.matchBadge}>
                <Feather name="droplet" size={12} color={colors.dred} />
                <Text style={styles.matchBadgeText}>Compatible avec ton groupe</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{alert.title ?? `Besoin urgent de poches ${groupsLabel}`}</Text>
            {alert.location_label && <Text style={styles.cardDetail}>{alert.location_label}</Text>}
            {alert.description && <Text style={styles.cardDetail}>{alert.description}</Text>}
            <Text style={styles.cardMeta}>
              {alert.units_needed} poche{alert.units_needed > 1 ? 's' : ''} nécessaire
              {alert.units_needed > 1 ? 's' : ''}
              {distance !== null ? ` · à ${distance.toFixed(1)} km de toi` : ''}
            </Text>

            <Pressable
              style={[styles.button, responded && styles.buttonDisabled]}
              disabled={responded}
              onPress={() => setSelectedAlert(alert)}
            >
              <Text style={styles.buttonText}>{responded ? 'Réponse enregistrée' : 'Je viens donner'}</Text>
            </Pressable>
          </View>
        );
      })}

      <EmergencyMissionModal
        alert={selectedAlert}
        donorId={donorId}
        donorProfile={donorProfile}
        distanceKm={
          selectedAlert && coords
            ? distanceKm(coords, { latitude: selectedAlert.origin_lat, longitude: selectedAlert.origin_lng })
            : null
        }
        donorCoords={coords}
        onClose={() => setSelectedAlert(null)}
        onAccepted={(id) => {
          setRespondedIds((current) => new Set(current).add(id));
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: colors.dred,
  },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dred,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgentBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.beige,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: colors.dred,
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  cardDetail: {
    fontSize: 13,
    color: colors.ink,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  button: {
    backgroundColor: colors.dred,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.success,
    opacity: 1,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
