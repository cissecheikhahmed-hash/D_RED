import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  beige: '#f8efd7',
  dred: '#a50606',
  success: '#1f9d55',
  border: '#e7e2d6',
};

const LIVES_PER_DONATION = 3;
const CONFETTI_COLORS = [colors.dred, colors.success, '#e8912d', colors.ink];
const CONFETTI_COUNT = 16;

function ConfettiPiece({
  delay,
  left,
  color,
}: {
  delay: number;
  left: `${number}%`;
  color: string;
}) {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fall.setValue(0);
    Animated.timing(fall, {
      toValue: 1,
      duration: 1800,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fall, delay]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [0, 280] });
  const opacity = fall.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '320deg'] });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { left, backgroundColor: color, opacity, transform: [{ translateY }, { rotate }] },
      ]}
    />
  );
}

export function DonationCelebrationModal({
  visible,
  totalDonations,
  onClose,
}: {
  visible: boolean;
  totalDonations: number;
  onClose: () => void;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.25,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 450,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, heartScale]);

  // Généré une seule fois par ouverture (pas à chaque render) : sinon
  // l'animation de chute redémarre en boucle avec de nouvelles positions
  // aléatoires à chaque re-render du parent.
  const confettiPieces = useMemo(() => {
    if (!visible) return [];
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      key: i,
      delay: Math.floor(Math.random() * 300),
      left: `${Math.round(Math.random() * 90)}%` as `${number}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const totalLivesImpacted = totalDonations * LIVES_PER_DONATION;

  async function handleShare() {
    try {
      await Share.share({
        message:
          `Je viens de faire un don de sang avec D.RED ! Grâce à ce don, ${LIVES_PER_DONATION} vies ` +
          `vont être impactées. Au total, mes dons ont déjà aidé ${totalLivesImpacted} personnes. 🩸❤️`,
      });
    } catch {
      // Partage annulé par l'utilisateur ou indisponible sur cet appareil —
      // rien à faire, ce n'est pas une erreur.
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.confettiLayer} pointerEvents="none">
          {confettiPieces.map((piece) => (
            <ConfettiPiece key={piece.key} delay={piece.delay} left={piece.left} color={piece.color} />
          ))}
        </View>

        <View style={styles.sheet}>
          <Animated.View style={[styles.heartWrap, { transform: [{ scale: heartScale }] }]}>
            <Feather name="heart" size={40} color={colors.white} />
          </Animated.View>

          <Text style={styles.title}>Un grand merci, Sauveur !</Text>
          <Text style={styles.subtitle}>Merci pour ta générosité !</Text>

          <View style={styles.impactCard}>
            <Feather name="users" size={20} color={colors.dred} />
            <Text style={styles.impactText}>
              Grâce à ton don d'aujourd'hui,{' '}
              <Text style={styles.impactBold}>{LIVES_PER_DONATION} vies</Text> ont été impactées et
              sauvées.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalDonations}</Text>
              <Text style={styles.statLabel}>Dons effectués</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalLivesImpacted}</Text>
              <Text style={styles.statLabel}>Vies sauvées au total</Text>
            </View>
          </View>

          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Feather name="share-2" size={18} color={colors.dred} />
            <Text style={styles.shareButtonText}>Partager mon impact</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 13, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiPiece: {
    position: 'absolute',
    top: -12,
    width: 8,
    height: 14,
    borderRadius: 2,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  heartWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dred,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: -8,
  },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.beige,
    borderRadius: 14,
    padding: 14,
  },
  impactText: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
  },
  impactBold: {
    fontWeight: '800',
    color: colors.dred,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.beige,
    borderRadius: 14,
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
  },
  statLabel: {
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.dred,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    marginTop: 8,
  },
  shareButtonText: {
    color: colors.dred,
    fontWeight: '700',
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.dred,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
