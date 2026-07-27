import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
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
  // Régénéré à chaque ouverture : la validité de 5 minutes limite le rejeu
  // d'une capture d'écran du QR code.
  const encryptedPayload = useMemo(() => (visible ? buildDonorPass(donor) : null), [visible, donor]);

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

          <View style={styles.qrWrap}>
            {encryptedPayload && <QRCode value={encryptedPayload} size={220} />}
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helper: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
