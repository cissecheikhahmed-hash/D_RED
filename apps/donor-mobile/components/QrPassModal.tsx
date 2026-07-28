import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { buildDonorPass } from '../lib/qrPass';

const colors = {
  ink: '#0b0b0d',
  inkSoft: '#4b4b52',
  white: '#ffffff',
  dred: '#a50606',
  border: '#e7e2d6',
};

const QR_SIZE = 220;

export function QrPassModal({
  visible,
  onClose,
  donor,
}: {
  visible: boolean;
  onClose: () => void;
  donor: {
    donorId: string;
    firstName: string;
    lastName: string;
    bloodGroup: string;
    sex: 'F' | 'M' | null;
    lastDonationDate: string | null;
  };
}) {
  const [encryptedPayload, setEncryptedPayload] = useState<string | null>(null);

  // Régénéré à chaque ouverture (pas à chaque re-render du parent) : la
  // validité de 5 minutes limite le rejeu d'une capture d'écran du QR code.
  useEffect(() => {
    if (visible) {
      setEncryptedPayload(buildDonorPass(donor));
    } else {
      setEncryptedPayload(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Pass donneur</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          {/* Dimensions explicites : sans ça, la vue conteneur peut se
              réduire à 0x0 sur certaines plateformes si elle se fie
              uniquement à la taille intrinsèque du SVG enfant. */}
          <View style={styles.qrWrap}>
            {encryptedPayload ? (
              <QRCode value={encryptedPayload} size={QR_SIZE} backgroundColor={colors.white} color={colors.ink} />
            ) : (
              <View style={styles.qrPlaceholder} />
            )}
          </View>

          <Text style={styles.helper}>
            Ce code est chiffré et valable 5 minutes. Seul le personnel médical habilité peut le
            lire.
          </Text>
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
    alignItems: 'center',
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
  qrWrap: {
    width: QR_SIZE + 32,
    height: QR_SIZE + 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrPlaceholder: {
    width: QR_SIZE,
    height: QR_SIZE,
  },
  helper: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
