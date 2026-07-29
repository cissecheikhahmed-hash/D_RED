import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

type EmergencyAlert = {
  id: string;
  title: string | null;
  description: string | null;
  location_label: string | null;
  blood_group: string;
  units_needed: number;
  radius_km: number;
  origin_lat: number;
  origin_lng: number;
};

export function EmergencyFeedSection({
  donorId,
  bloodGroup,
  coords,
}: {
  donorId: string;
  bloodGroup: string;
  coords: { latitude: number; longitude: number } | null;
}) {
  const [alerts, setAlerts] = useState<EmergencyAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data, error: fetchError } = await supabase
        .from('emergency_alerts')
        .select(
          'id, title, description, location_label, blood_group, units_needed, radius_km, origin_lat, origin_lng',
        )
        .eq('status', 'OPEN')
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`);

      if (fetchError) {
        // Attendu tant que les migrations campaigns_and_emergency_alerts /
        // campaigns_emergency_v2 n'ont pas été exécutées sur ce projet.
        setError(fetchError.message);
        return;
      }
      setAlerts(data ?? []);

      const { data: responses } = await supabase
        .from('emergency_responses')
        .select('emergency_id')
        .eq('donor_id', donorId);
      if (responses) {
        setRespondedIds(new Set(responses.map((r) => r.emergency_id)));
      }
    })();
  }, [donorId]);

  async function handleRespond(emergencyId: string) {
    setRespondingId(emergencyId);
    const { error: respondError } = await supabase
      .from('emergency_responses')
      .insert({ emergency_id: emergencyId, donor_id: donorId });
    // Une contrainte unique (emergency_id, donor_id) existe déjà : une
    // deuxième réponse renvoie une erreur de conflit, qu'on traite comme un
    // succès (le donneur a déjà répondu, pas la peine de le lui dire comme
    // une erreur).
    if (!respondError || respondError.code === '23505') {
      setRespondedIds((current) => new Set(current).add(emergencyId));
    }
    setRespondingId(null);
  }

  if (error) return null;
  if (alerts === null) return null;

  const inRange = alerts
    .map((alert) => {
      const distance = coords
        ? distanceKm(coords, { latitude: alert.origin_lat, longitude: alert.origin_lng })
        : null;
      return { alert, distance, matchesGroup: alert.blood_group === bloodGroup };
    })
    .filter(({ distance, alert }) => distance === null || distance <= alert.radius_km)
    .sort((a, b) => {
      if (a.matchesGroup !== b.matchesGroup) return a.matchesGroup ? -1 : 1;
      if (a.distance === null || b.distance === null) return 0;
      return a.distance - b.distance;
    });

  if (inRange.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Urgences près de toi</Text>
      {inRange.map(({ alert, distance, matchesGroup }) => {
        const responded = respondedIds.has(alert.id);
        return (
          <View key={alert.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.urgentBadge}>
                <Feather name="alert-circle" size={12} color={colors.white} />
                <Text style={styles.urgentBadgeText}>{alert.blood_group}</Text>
              </View>
              {matchesGroup && (
                <View style={styles.matchBadge}>
                  <Feather name="droplet" size={12} color={colors.dred} />
                  <Text style={styles.matchBadgeText}>Compatible avec ton groupe</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardTitle}>{alert.title ?? `Besoin urgent de poches ${alert.blood_group}`}</Text>
            {alert.location_label && <Text style={styles.cardDetail}>{alert.location_label}</Text>}
            {alert.description && <Text style={styles.cardDetail}>{alert.description}</Text>}
            <Text style={styles.cardMeta}>
              {alert.units_needed} poche{alert.units_needed > 1 ? 's' : ''} nécessaire
              {alert.units_needed > 1 ? 's' : ''}
              {distance !== null ? ` · à ${distance.toFixed(1)} km de toi` : ''}
            </Text>

            <Pressable
              style={[styles.button, (responded || respondingId === alert.id) && styles.buttonDisabled]}
              disabled={responded || respondingId === alert.id}
              onPress={() => handleRespond(alert.id)}
            >
              <Text style={styles.buttonText}>
                {responded ? 'Réponse enregistrée' : 'Je viens donner'}
              </Text>
            </Pressable>
          </View>
        );
      })}
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
