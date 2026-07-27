import CryptoJS from 'crypto-js';

export type DonorPassPayload = {
  donorId: string;
  firstName: string;
  lastName: string;
  bloodGroup: string;
  sex: 'F' | 'M' | null;
  lastDonationDate: string | null;
  issuedAt: number;
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.EXPO_PUBLIC_QR_PASS_SECRET;
  if (!secret) {
    throw new Error('EXPO_PUBLIC_QR_PASS_SECRET doit être défini dans apps/doctor-mobile/.env.');
  }
  return secret;
}

export type DecryptResult =
  | { ok: true; payload: DonorPassPayload }
  | { ok: false; reason: 'invalid' | 'expired' };

export function decryptDonorPass(encrypted: string): DecryptResult {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, getSecret());
    const json = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) return { ok: false, reason: 'invalid' };

    const payload = JSON.parse(json) as DonorPassPayload;
    if (!payload.donorId || !payload.expiresAt) return { ok: false, reason: 'invalid' };
    if (Date.now() > payload.expiresAt) return { ok: false, reason: 'expired' };

    return { ok: true, payload };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
