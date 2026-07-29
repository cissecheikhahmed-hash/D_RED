import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { distanceKm } from '../lib/distance';
import { supabase } from '../lib/supabase';

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  beige: '#f8efd7',
  dred: '#a50606',
  border: '#e7e2d6',
};

type Campaign = {
  id: string;
  title: string;
  blood_groups: string[] | null;
  scheduled_at: string;
  location_label: string;
  origin_lat: number;
  origin_lng: number;
  radius_km: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function CampaignsSection({
  bloodGroup,
  coords,
}: {
  bloodGroup: string;
  coords: { latitude: number; longitude: number } | null;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data, error: fetchError } = await supabase
        .from('campaigns')
        .select('id, title, blood_groups, scheduled_at, location_label, origin_lat, origin_lng, radius_km')
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
        .order('scheduled_at', { ascending: true });

      if (fetchError) {
        // Attendu tant que les migrations campaigns_and_emergency_alerts /
        // campaigns_emergency_v2 n'ont pas été exécutées sur ce projet.
        setError(fetchError.message);
        return;
      }
      setCampaigns(data ?? []);
    })();
  }, []);

  const sortedCampaigns = (campaigns ?? [])
    .filter((campaign) => {
      if (!coords) return true;
      return distanceKm(coords, { latitude: campaign.origin_lat, longitude: campaign.origin_lng }) <= campaign.radius_km;
    })
    .sort((a, b) => {
      if (!coords) return 0;
      const distA = distanceKm(coords, { latitude: a.origin_lat, longitude: a.origin_lng });
      const distB = distanceKm(coords, { latitude: b.origin_lat, longitude: b.origin_lng });
      return distA - distB;
    });

  return (
    <>
      <Text style={styles.sectionTitle}>Campagnes de don à venir</Text>

      {error && (
        <View style={styles.emptyState}>
          <Feather name="alert-triangle" size={22} color={colors.inkSoft} />
          <Text style={styles.emptyStateText}>
            Impossible de charger les campagnes pour le moment.
          </Text>
        </View>
      )}

      {!error && campaigns === null && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Chargement…</Text>
        </View>
      )}

      {!error && campaigns !== null && sortedCampaigns.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconWrap}>
            <Feather name="calendar" size={22} color={colors.inkSoft} />
          </View>
          <Text style={styles.emptyStateText}>
            Aucune campagne à proximité pour le moment. Reviens plus tard !
          </Text>
        </View>
      )}

      {!error &&
        sortedCampaigns.map((campaign) => {
          const targetsMyGroup = !campaign.blood_groups || campaign.blood_groups.includes(bloodGroup);
          const distance = coords
            ? distanceKm(coords, { latitude: campaign.origin_lat, longitude: campaign.origin_lng })
            : null;

          return (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                {targetsMyGroup && (
                  <View style={styles.matchBadge}>
                    <Feather name="droplet" size={12} color={colors.white} />
                    <Text style={styles.matchBadgeText}>Compatible avec ton groupe</Text>
                  </View>
                )}
              </View>
              <Text style={styles.campaignDetail}>{formatDate(campaign.scheduled_at)}</Text>
              <Text style={styles.campaignDetail}>{campaign.location_label}</Text>
              <Text style={styles.campaignMeta}>
                Rayon {campaign.radius_km} km
                {distance !== null ? ` · à ${distance.toFixed(1)} km de toi` : ''}
              </Text>
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
  emptyState: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
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
  campaignCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  campaignTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    flexShrink: 1,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dred,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  campaignDetail: {
    fontSize: 13,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  campaignMeta: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 4,
  },
});
