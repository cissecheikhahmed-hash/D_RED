import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { getEligibility } from '../lib/eligibility';
import { decryptDonorPass, type DonorPassPayload } from '../lib/qrPass';

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

type ScanState =
  | { step: 'scanning' }
  | { step: 'error'; reason: 'invalid' | 'expired' }
  | { step: 'result'; payload: DonorPassPayload };

export function ScanDonorModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ step: 'scanning' });
  const [validated, setValidated] = useState(false);

  function handleClose() {
    setState({ step: 'scanning' });
    setValidated(false);
    onClose();
  }

  function handleBarcodeScanned({ data }: { data: string }) {
    if (state.step !== 'scanning') return;
    const result = decryptDonorPass(data);
    if (!result.ok) {
      setState({ step: 'error', reason: result.reason });
      return;
    }
    setState({ step: 'result', payload: result.payload });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Scanner un pass donneur</Text>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Feather name="x" size={20} color={colors.inkSoft} />
          </Pressable>
        </View>

        {state.step === 'scanning' && (
          <>
            {!permission ? (
              <View style={styles.center}>
                <Text style={styles.helper}>Vérification de la permission caméra…</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.center}>
                <Feather name="camera-off" size={28} color={colors.inkSoft} />
                <Text style={styles.helper}>
                  L'accès à la caméra est nécessaire pour scanner le pass donneur.
                </Text>
                <Pressable style={styles.button} onPress={requestPermission}>
                  <Text style={styles.buttonText}>Autoriser la caméra</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.cameraWrap}>
                <CameraView
                  style={styles.camera}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={handleBarcodeScanned}
                />
                <Text style={styles.scanHint}>Cadre le QR code du pass donneur</Text>
              </View>
            )}
          </>
        )}

        {state.step === 'error' && (
          <View style={styles.center}>
            <Feather name="alert-triangle" size={28} color={colors.waiting} />
            <Text style={styles.helper}>
              {state.reason === 'expired'
                ? 'Ce pass a expiré (validité 5 minutes). Demande au donneur de le régénérer.'
                : "Ce QR code n'est pas un pass donneur valide."}
            </Text>
            <Pressable style={styles.button} onPress={() => setState({ step: 'scanning' })}>
              <Text style={styles.buttonText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {state.step === 'result' &&
          (() => {
            const lastDonationDate = state.payload.lastDonationDate
              ? new Date(state.payload.lastDonationDate)
              : null;
            const { eligible, daysRemaining, monthsRemaining } = getEligibility(
              lastDonationDate,
              state.payload.sex,
            );

            return (
              <View style={styles.resultWrap}>
                <View style={styles.donorCard}>
                  <Text style={styles.donorName}>
                    {state.payload.firstName} {state.payload.lastName}
                  </Text>
                  <View style={styles.bloodBadge}>
                    <Feather name="droplet" size={14} color={colors.white} />
                    <Text style={styles.bloodBadgeText}>{state.payload.bloodGroup}</Text>
                  </View>
                </View>

                <View
                  style={[styles.eligibilityCard, eligible ? styles.cardSuccess : styles.cardWaiting]}
                >
                  <Feather
                    name={eligible ? 'check-circle' : 'clock'}
                    size={22}
                    color={eligible ? colors.success : colors.waiting}
                  />
                  <Text style={styles.eligibilityText}>
                    {eligible
                      ? 'Éligible pour donner aujourd\'hui'
                      : daysRemaining >= 30
                        ? `Éligible dans ${monthsRemaining} mois`
                        : `Éligible dans ${daysRemaining} jours`}
                  </Text>
                </View>

                <Pressable
                  style={[styles.button, (!eligible || validated) && styles.buttonDisabled]}
                  disabled={!eligible || validated}
                  onPress={() => setValidated(true)}
                >
                  <Text style={styles.buttonText}>
                    {validated ? 'Don enregistré (local)' : 'Valider ce don'}
                  </Text>
                </Pressable>
                {validated && (
                  <Text style={styles.helperSmall}>
                    Non persisté côté Supabase pour l'instant — voir la note de mise en œuvre.
                  </Text>
                )}

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    setState({ step: 'scanning' });
                    setValidated(false);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Scanner un autre pass</Text>
                </Pressable>
              </View>
            );
          })()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.beige,
    padding: 20,
    paddingTop: 48,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  helper: {
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  helperSmall: {
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  cameraWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    gap: 8,
  },
  camera: {
    flex: 1,
  },
  scanHint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.inkSoft,
  },
  button: {
    backgroundColor: colors.dred,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dred,
  },
  secondaryButtonText: {
    color: colors.dred,
    fontWeight: '700',
  },
  resultWrap: {
    gap: 16,
  },
  donorCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    gap: 10,
    alignItems: 'center',
  },
  donorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
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
  eligibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  cardSuccess: {
    borderLeftColor: colors.success,
  },
  cardWaiting: {
    borderLeftColor: colors.waiting,
  },
  eligibilityText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
});
