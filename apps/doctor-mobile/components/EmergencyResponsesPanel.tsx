import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { distanceKm } from '../lib/distance';
import type { HospitalProfile } from '../lib/hospital';
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

const SATISFIED_MESSAGE =
  "C'est bon, un sauveur est déjà en cours de route ! Merci pour ta mobilisation, cette urgence est désormais couverte.";

type Alert = {
  id: string;
  title: string | null;
  blood_groups: string[] | null;
  need_type: string | null;
  units_needed: number;
};

type Response = {
  id: string;
  emergency_id: string;
  donor_id: string;
  donor_first_name: string | null;
  donor_last_name: string | null;
  donor_blood_group: string | null;
  donor_phone: string | null;
  donor_lat: number | null;
  donor_lng: number | null;
};

export function EmergencyResponsesPanel({
  doctorId,
  hospital,
}: {
  doctorId: string;
  hospital: HospitalProfile | null;
}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data: alertsData, error: alertsError } = await supabase
      .from('emergency_alerts')
      .select('id, title, blood_groups, need_type, units_needed')
      .eq('created_by', doctorId)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    if (alertsError) {
      setError(alertsError.message);
      return;
    }
    setAlerts(alertsData ?? []);

    const alertIds = (alertsData ?? []).map((a) => a.id);
    if (alertIds.length === 0) {
      setResponses([]);
      return;
    }

    const { data: responsesData, error: responsesError } = await supabase
      .from('emergency_responses')
      .select(
        'id, emergency_id, donor_id, donor_first_name, donor_last_name, donor_blood_group, donor_phone, donor_lat, donor_lng',
      )
      .in('emergency_id', alertIds)
      .order('responded_at', { ascending: true });

    if (responsesError) {
      setError(responsesError.message);
      return;
    }
    setResponses(responsesData ?? []);
  }

  useEffect(() => {
    refresh();

    // Réactivité temps réel : dès qu'un donneur accepte ("J'accepte la
    // mission") ou qu'une alerte change de statut, le tableau de bord se
    // resynchronise sans action du médecin — même mécanique que le flux
    // donneur (EmergencyFeedSection/CampaignsSection).
    const channel = supabase
      .channel(`doctor_emergency_responses_${doctorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_responses' }, () =>
        refresh(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, () =>
        refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  if (error) return null;
  if (alerts.length === 0) return null;

  function handleCall(phone: string | null) {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  }

  async function handleMarkSatisfied(alert: Alert) {
    setClosingId(alert.id);

    const { error: closeError } = await supabase
      .from('emergency_alerts')
      .update({ status: 'CLOSED' })
      .eq('id', alert.id);

    if (!closeError) {
      // Mise en file uniquement : aucun job serveur ne consomme encore
      // `sms_notifications` (pas de Twilio/Edge Function branché) — la
      // clôture de l'alerte ci-dessus est ce qui retire réellement
      // l'urgence de l'écran des autres donneurs (realtime), tout de
      // suite. Voir supabase/migrations/20260730_doctor_dashboard_realtime.
      const responders = responses.filter((r) => r.emergency_id === alert.id && r.donor_phone);
      if (responders.length > 0) {
        await supabase.from('sms_notifications').insert(
          responders.map((r) => ({
            donor_id: r.donor_id,
            phone: r.donor_phone as string,
            message: SATISFIED_MESSAGE,
            related_alert_id: alert.id,
          })),
        );
      }
    }

    setClosingId(null);
    refresh();
  }

  return (
    <>
      {alerts.map((alert) => {
        const alertResponses = responses.filter((r) => r.emergency_id === alert.id);
        const groupsLabel = alert.blood_groups ? alert.blood_groups.join(' / ') : 'Tous groupes';

        return (
          <View key={alert.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="alert-circle" size={16} color={colors.dred} />
              <Text style={styles.cardTitle}>
                {alert.title ?? `Besoin urgent de poches ${groupsLabel}`}
              </Text>
            </View>
            <Text style={styles.cardMeta}>
              {groupsLabel} · {alert.units_needed} poche{alert.units_needed > 1 ? 's' : ''}
              {alert.need_type ? ` · ${alert.need_type}` : ''}
            </Text>

            {alertResponses.length === 0 ? (
              <Text style={styles.emptyText}>En attente d'un premier donneur…</Text>
            ) : (
              alertResponses.map((response) => {
                const donorCoords =
                  response.donor_lat != null && response.donor_lng != null
                    ? { latitude: response.donor_lat, longitude: response.donor_lng }
                    : null;
                const distance =
                  hospital && donorCoords
                    ? distanceKm({ latitude: hospital.lat, longitude: hospital.lng }, donorCoords)
                    : null;
                const fullName = [response.donor_first_name, response.donor_last_name]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <View key={response.id} style={styles.responderRow}>
                    <View style={styles.responderIconWrap}>
                      <Feather name="user-check" size={18} color={colors.success} />
                    </View>
                    <View style={styles.responderTextWrap}>
                      <Text style={styles.responderName}>{fullName || 'Donneur'}</Text>
                      <Text style={styles.responderMeta}>
                        {response.donor_blood_group ?? '—'}
                        {distance !== null ? ` · à ${distance.toFixed(1)} km` : ''}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.callButton, !response.donor_phone && styles.callButtonDisabled]}
                      onPress={() => handleCall(response.donor_phone)}
                      disabled={!response.donor_phone}
                    >
                      <Feather name="phone" size={16} color={colors.white} />
                    </Pressable>
                  </View>
                );
              })
            )}

            {alertResponses.length > 0 && (
              <Pressable
                style={styles.satisfiedButton}
                onPress={() => handleMarkSatisfied(alert)}
                disabled={closingId === alert.id}
              >
                <Feather name="check-circle" size={16} color={colors.dred} />
                <Text style={styles.satisfiedButtonText}>
                  {closingId === alert.id
                    ? 'Clôture…'
                    : 'Alerte satisfaite — prévenir les autres donneurs'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.dred,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    flexShrink: 1,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  emptyText: {
    fontSize: 13,
    color: colors.inkSoft,
    fontStyle: 'italic',
  },
  responderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.beige,
    borderRadius: 12,
    padding: 10,
  },
  responderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  responderTextWrap: {
    flex: 1,
  },
  responderName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  responderMeta: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 1,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
  },
  callButtonDisabled: {
    backgroundColor: colors.border,
  },
  satisfiedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.dred,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  satisfiedButtonText: {
    color: colors.dred,
    fontWeight: '700',
    fontSize: 13,
  },
});
