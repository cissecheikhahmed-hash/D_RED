import { Feather } from '@expo/vector-icons';
import type { Session } from '@supabase/supabase-js';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CampaignModal } from '../components/CampaignModal';
import { EmergencyAlertModal } from '../components/EmergencyAlertModal';
import { ScanDonorModal } from '../components/ScanDonorModal';
import { supabase } from '../lib/supabase';

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  beige: '#f8efd7',
  dred: '#a50606',
  border: '#e7e2d6',
};

export function DoctorDashboardScreen({ session }: { session: Session }) {
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const role: string | null = session.user.user_metadata?.role ?? null;
  const isAuthorizedRole = role === 'HOSPITAL' || role === 'CNTS_ADMIN';

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Espace médical</Text>
          <Text style={styles.subGreeting}>{session.user.email}</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={handleSignOut}>
          <Feather name="log-out" size={18} color={colors.inkSoft} />
        </Pressable>
      </View>

      {!isAuthorizedRole && (
        <View style={styles.warningBanner}>
          <Feather name="alert-triangle" size={16} color="#B45309" />
          <Text style={styles.warningText}>
            Ce compte n'a pas de rôle Hôpital/CNTS configuré côté Supabase — accès de test, non
            contrôlé pour l'instant.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Mobiliser des donneurs</Text>

      <Pressable
        style={[styles.primaryActionCard, styles.emergencyCard]}
        onPress={() => setEmergencyModalVisible(true)}
      >
        <View style={styles.emergencyIconWrap}>
          <Feather name="alert-circle" size={24} color={colors.white} />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={styles.emergencyTitle}>Alerte d'urgence vitale</Text>
          <Text style={styles.emergencySubtitle}>
            Groupe sanguin + poches nécessaires — rayon fixe 10 km, diffusion immédiate
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.white} />
      </Pressable>

      <Pressable style={styles.primaryActionCard} onPress={() => setCampaignModalVisible(true)}>
        <View style={styles.actionIconWrap}>
          <Feather name="calendar" size={22} color={colors.dred} />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>Campagne de don programmée</Text>
          <Text style={styles.actionSubtitle}>Titre, date, lieu, groupes ciblés, rayon</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.inkSoft} />
      </Pressable>

      <Text style={styles.sectionTitle}>Vérification sur place</Text>

      <Pressable style={styles.actionCard} onPress={() => setScanModalVisible(true)}>
        <View style={styles.actionIconWrap}>
          <Feather name="camera" size={22} color={colors.dred} />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>Scanner le pass donneur</Text>
          <Text style={styles.actionSubtitle}>Vérifier l'identité et l'éligibilité sur place</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.inkSoft} />
      </Pressable>

      <CampaignModal
        visible={campaignModalVisible}
        onClose={() => setCampaignModalVisible(false)}
        doctorId={session.user.id}
      />
      <EmergencyAlertModal
        visible={emergencyModalVisible}
        onClose={() => setEmergencyModalVisible(false)}
        doctorId={session.user.id}
      />
      <ScanDonorModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        doctorId={session.user.id}
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
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  subGreeting: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  primaryActionCard: {
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
  emergencyCard: {
    backgroundColor: colors.dred,
  },
  emergencyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  actionCard: {
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
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.beige,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
});
