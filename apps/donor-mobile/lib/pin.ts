import CryptoJS from 'crypto-js';

const PIN_PATTERN = /^\d{4}$/;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

// Le PIN ne sert jamais à se connecter (l'authentification est 100% OTP
// SMS) — il sert de verrou local futur (consultation du dossier médical,
// confirmation du QR). On ne le stocke donc jamais en clair dans
// `user_metadata` (visible dans le JWT/la session), seulement son hash.
export function hashPin(pin: string): string {
  return CryptoJS.SHA256(pin).toString();
}
