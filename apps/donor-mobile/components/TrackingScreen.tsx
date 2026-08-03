import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../lib/supabase';
import type { EmergencyAlert } from './EmergencyFeedSection';

const colors = {
  dred: '#a50606',
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  border: '#e7e2d6',
};

const ASSUMED_SPEED_KMH = 30;

function estimateMinutes(km: number): number {
  return Math.max(Math.round((km / ASSUMED_SPEED_KMH) * 60), 1);
}

// Carte OSM/Leaflet embarquée via WebView : tuiles chargées en direct depuis
// tile.openstreetmap.org (acceptable en production, contrairement à la
// contrainte "zéro requête réseau" du prototype de démo). Pas de routage
// réel : simple ligne droite entre le donneur et l'hôpital.
function buildMapHtml(
  donor: { latitude: number; longitude: number },
  hospital: { latitude: number; longitude: number },
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var donor = [${donor.latitude}, ${donor.longitude}];
    var hospital = [${hospital.latitude}, ${hospital.longitude}];
    var map = L.map('map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    var donorIcon = L.divIcon({ className: '', html: '<div style="width:16px;height:16px;border-radius:8px;background:#1f9d55;border:2px solid white;"></div>' });
    var hospitalIcon = L.divIcon({ className: '', html: '<div style="width:18px;height:18px;border-radius:9px;background:#a50606;border:2px solid white;"></div>' });
    L.marker(donor, { icon: donorIcon }).addTo(map);
    L.marker(hospital, { icon: hospitalIcon }).addTo(map);
    L.polyline([donor, hospital], { color: '#a50606', weight: 3, dashArray: '6 8' }).addTo(map);
    map.fitBounds([donor, hospital], { padding: [40, 40] });
  </script>
</body>
</html>`;
}

export function TrackingScreen({
  alert,
  donorCoords,
  distanceKm,
  onDone,
}: {
  alert: EmergencyAlert;
  donorCoords: { latitude: number; longitude: number } | null;
  distanceKm: number | null;
  onDone: () => void;
}) {
  const [withdrawing, setWithdrawing] = useState(false);

  async function handleWithdraw() {
    setWithdrawing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('emergency_responses')
        .delete()
        .eq('emergency_id', alert.id)
        .eq('donor_id', user.id);
    }
    setWithdrawing(false);
    onDone();
  }

  const minutes = distanceKm !== null ? estimateMinutes(distanceKm) : null;
  const hospital = { latitude: alert.origin_lat, longitude: alert.origin_lng };

  return (
    <Modal visible animationType="slide" onRequestClose={onDone}>
      <View style={styles.screen}>
        <View style={styles.mapWrap}>
          {donorCoords ? (
            <WebView
              style={styles.map}
              originWhitelist={['*']}
              source={{ html: buildMapHtml(donorCoords, hospital) }}
            />
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Position indisponible pour afficher la carte.</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.hospitalName}>{alert.location_label ?? 'Destination'}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{minutes !== null ? `≈ ${minutes} min` : '—'}</Text>
              <Text style={styles.metricLabel}>Temps restant</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '—'}
              </Text>
              <Text style={styles.metricLabel}>restants</Text>
            </View>
          </View>

          <Pressable style={styles.arrivedButton} onPress={onDone}>
            <Text style={styles.arrivedButtonText}>Je suis arrivé(e)</Text>
          </Pressable>
          <Pressable style={styles.withdrawButton} onPress={handleWithdraw} disabled={withdrawing}>
            <Text style={styles.withdrawButtonText}>
              {withdrawing ? 'Retrait…' : 'Me désister'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mapFallbackText: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  hospitalName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8efd7',
    borderRadius: 14,
    paddingVertical: 14,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  arrivedButton: {
    backgroundColor: colors.dred,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  arrivedButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  withdrawButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  withdrawButtonText: {
    color: colors.inkSoft,
    fontWeight: '600',
    fontSize: 14,
  },
});
