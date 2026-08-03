import CryptoJS from 'crypto-js';

const PIN_PATTERN = /^\d{4}$/;

// `.trim()` appliqué ici (source unique) plutôt que dans chaque écran
// appelant : garantit que la validation, le hash à l'inscription et le
// hash à la connexion voient toujours exactement la même chaîne, même si
// une espace invisible s'est glissée dans la saisie (clavier, copier-coller).
export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin.trim());
}

// Le PIN ne sert jamais à se connecter directement (l'authentification est
// 100% OTP SMS) — il sert de verrou local (consultation du dossier
// médical, confirmation du QR) et, côté connexion, de vérification
// anti-harcèlement avant l'envoi du SMS (`verify_signin_pin`). On ne le
// stocke donc jamais en clair dans `user_metadata` (visible dans le
// JWT/la session), seulement son hash.
export function hashPin(pin: string): string {
  return CryptoJS.SHA256(pin.trim()).toString();
}
