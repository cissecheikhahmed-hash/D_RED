import CryptoJS from 'crypto-js';

const QR_PASS_VALIDITY_MS = 5 * 60 * 1000;

export type DonorPassPayload = {
  donorId: string;
  firstName: string;
  lastName: string;
  bloodGroup: string;
  issuedAt: number;
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.EXPO_PUBLIC_QR_PASS_SECRET;
  if (!secret) {
    throw new Error('EXPO_PUBLIC_QR_PASS_SECRET doit être défini dans apps/donor-mobile/.env.');
  }
  return secret;
}

export function buildDonorPass(donor: {
  donorId: string;
  firstName: string;
  lastName: string;
  bloodGroup: string;
}): string {
  const payload: DonorPassPayload = {
    ...donor,
    issuedAt: Date.now(),
    expiresAt: Date.now() + QR_PASS_VALIDITY_MS,
  };
  return CryptoJS.AES.encrypt(JSON.stringify(payload), getSecret()).toString();
}
