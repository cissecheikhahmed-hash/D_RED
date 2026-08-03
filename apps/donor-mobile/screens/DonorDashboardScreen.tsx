import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { CampaignsSection } from '../components/CampaignsSection';
import { DonationCelebrationModal } from '../components/DonationCelebrationModal';
import { EmergencyFeedSection } from '../components/EmergencyFeedSection';
import { PinPromptModal } from '../components/PinPromptModal';
import { QrPassModal } from '../components/QrPassModal';
import { supabase } from '../lib/supabase';

const MIN_MONTHS_BETWEEN_DONATIONS: Record<'F' | 'M', number> = { F: 3, M: 4 };
const LIVES_PER_DONATION = 3;

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  beige: '#f8efd7',
  dred: '#a50606',
  success: '#1f9d55',
  waiting: '#e8912d',
  border: '#e7e2d6',
};

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((to.getTime() - from.getTime()) / msPerDay);
}

function getEligibility(
  lastDonationDate: Date | null,
  sex: 'F' | 'M' | null,
): { eligible: boolean; daysRemaining: number; monthsRemaining: number; eligibleFrom: Date | null } {
  if (!lastDonationDate) {
    return { eligible: true, daysRemaining: 0, monthsRemaining: 0, eligibleFrom: null };
  }

  // Le sexe est obligatoire depuis l'inscription ; s'il manque (compte créé
  // avant l'ajout de ce champ), on applique le délai le plus prudent.
  const requiredMonths = sex ? MIN_MONTHS_BETWEEN_DONATIONS[sex] : MIN_MONTHS_BETWEEN_DONATIONS.M;
  const eligibleFrom = addMonths(lastDonationDate, requiredMonths);
  const daysRemaining = Math.max(daysBetween(new Date(), eligibleFrom), 0);

  return {
    eligible: daysRemaining <= 0,
    daysRemaining,
    monthsRemaining: Math.ceil(daysRemaining / 30),
    eligibleFrom: daysRemaining > 0 ? eligibleFrom : null,
  };
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function DonorDashboardScreen({ session }: { session: Session }) {
  const metadata = session.user.user_metadata ?? {};
  const firstName: string = metadata.first_name ?? '';
  const lastName: string = metadata.last_name ?? '';
  const bloodGroup: string = metadata.blood_group ?? '—';
  const sex: 'F' | 'M' | null = metadata.sex ?? null;
  const lastDonationDate: Date | null = metadata.last_donation_date
    ? new Date(metadata.last_donation_date)
    : null;

  const { eligible, daysRemaining, monthsRemaining, eligibleFrom } = getEligibility(
    lastDonationDate,
    sex,
  );

  const [locationDenied, setLocationDenied] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [passVisible, setPassVisible] = useState(false);
  const [pinPromptVisible, setPinPromptVisible] = useState(false);
  // Historique réel (table `donations`, RLS : le donneur ne lit que ses
  // propres lignes), plus fiable que l'ancien calcul 0/1 basé sur
  // `last_donation_date`. `null` tant que le premier chargement n'a pas
  // répondu — affiché comme 0 en attendant (requête rapide, pas de skeleton
  // dédié pour un simple compteur).
  const [totalDonations, setTotalDonations] = useState<number | null>(null);
  // Non-null = un don vient d'être validé côté médecin, affiche la modale
  // de félicitations avec ce total.
  const [celebrationTotal, setCelebrationTotal] = useState<number | null>(null);

  const donationsCompleted = totalDonations ?? 0;
  const livesImpacted = donationsCompleted * LIVES_PER_DONATION;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    async function refreshDonationsCount(showCelebration: boolean) {
      const { count, error } = await supabase
        .from('donations')
        .select('id', { count: 'exact', head: true })
        .eq('donor_id', session.user.id);
      if (error) return;
      const total = count ?? 0;
      setTotalDonations(total);
      if (showCelebration) setCelebrationTotal(total);
    }

    refreshDonationsCount(false);

    // Réactivité temps réel : dès que le médecin valide le don (scan du
    // pass, RPC `validate_donation`), la modale de félicitations s'affiche
    // sans action du donneur — même mécanique que les flux
    // campagnes/urgences (refetch complet plutôt qu'incrément local, pour
    // rester la source de vérité même en cas d'événements manqués).
    const channel = supabase
      .channel(`donor_donations_${session.user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        (payload) => {
          const row = payload.new as { donor_id: string };
          if (row.donor_id === session.user.id) refreshDonationsCount(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.user.id]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour{firstName ? `, ${firstName}` : ''}</Text>
          <Text style={styles.subGreeting}>Ton espace donneur</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.bloodBadge}>
            <Feather name="droplet" size={14} color={colors.white} />
            <Text style={styles.bloodBadgeText}>{bloodGroup}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={handleSignOut}>
            <Feather name="log-out" size={18} color={colors.inkSoft} />
          </Pressable>
        </View>
      </View>

      {locationDenied && (
        <View style={styles.locationBanner}>
          <Feather name="map-pin" size={16} color={colors.waiting} />
          <Text style={styles.locationBannerText}>
            Active la localisation pour être proposé aux urgences proches de toi.
          </Text>
        </View>
      )}
      {coords && (
        <View style={styles.locationBanner}>
          <Feather name="map-pin" size={16} color={colors.success} />
          <Text style={styles.locationBannerText}>
            Position détectée — tu peux être proposé aux urgences à proximité.
          </Text>
        </View>
      )}

      <View style={[styles.card, eligible ? styles.cardSuccess : styles.cardWaiting]}>
        <View style={styles.cardIconWrap}>
          <Feather
            name={eligible ? 'check-circle' : 'clock'}
            size={22}
            color={eligible ? colors.success : colors.waiting}
          />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle}>
            {eligible
              ? 'Éligible pour donner aujourd\'hui'
              : daysRemaining >= 30
                ? `Éligible dans ${monthsRemaining} mois`
                : `Éligible dans ${daysRemaining} jours`}
          </Text>
          <Text style={styles.cardSubtitle}>
            {eligible
              ? 'Aucun délai en cours depuis ton dernier don.'
              : `Prochain don possible le ${eligibleFrom ? formatDateFr(eligibleFrom) : '—'}.`}
          </Text>
        </View>
      </View>

      <Pressable style={styles.secondaryAction} onPress={() => setPinPromptVisible(true)}>
        <Feather name="credit-card" size={20} color={colors.dred} />
        <Text style={styles.secondaryActionText}>Mon pass donneur</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Mon impact</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Feather name="bar-chart-2" size={20} color={colors.dred} />
          <Text style={styles.statValue}>{donationsCompleted}</Text>
          <Text style={styles.statLabel}>Dons effectués</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="users" size={20} color={colors.dred} />
          <Text style={styles.statValue}>{livesImpacted}</Text>
          <Text style={styles.statLabel}>Vies impactées</Text>
        </View>
      </View>

      {eligible ? (
        <>
          <EmergencyFeedSection
            donorId={session.user.id}
            donorProfile={{ firstName, lastName, bloodGroup, phone: session.user.phone ?? null }}
            bloodGroup={bloodGroup}
            coords={coords}
          />
          <CampaignsSection bloodGroup={bloodGroup} coords={coords} />
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconWrap}>
            <Feather name="bell-off" size={22} color={colors.inkSoft} />
          </View>
          <Text style={styles.emptyStateText}>
            Les urgences et campagnes s'affichent une fois que tu es de nouveau éligible au don.
          </Text>
        </View>
      )}

      <PinPromptModal
        visible={pinPromptVisible}
        storedPinHash={metadata.pin_hash ?? null}
        onCancel={() => setPinPromptVisible(false)}
        onSuccess={() => {
          setPinPromptVisible(false);
          setPassVisible(true);
        }}
      />
      <QrPassModal
        visible={passVisible}
        onClose={() => setPassVisible(false)}
        donor={{
          donorId: session.user.id,
          firstName,
          lastName,
          bloodGroup,
          sex,
          lastDonationDate: metadata.last_donation_date ?? null,
        }}
      />
      <DonationCelebrationModal
        visible={celebrationTotal !== null}
        totalDonations={celebrationTotal ?? 0}
        onClose={() => setCelebrationTotal(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.beige,
  },
  content: {
    padding: 20,
    paddingTop: 32,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dred,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bloodBadgeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.inkSoft,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  cardWaiting: {
    borderLeftWidth: 4,
    borderLeftColor: colors.waiting,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.beige,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.dred,
    paddingVertical: 14,
  },
  secondaryActionText: {
    color: colors.dred,
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
  },
  statLabel: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.ink,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  emptyStateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.beige,
  },
  emptyStateText: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 19,
  },
});
