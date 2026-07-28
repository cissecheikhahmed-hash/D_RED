const PIN_PATTERN = /^\d{4}$/;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

// Supabase Auth exige un mot de passe d'au moins 6 caractères par défaut :
// on dérive un mot de passe stable à partir du PIN plutôt que d'envoyer les
// 4 chiffres bruts, qui seraient rejetés par cette contrainte de longueur.
//
// ATTENTION sécurité : un PIN à 4 chiffres ne représente que 10 000
// combinaisons possibles. Cette transformation ne rend pas l'authentification
// aussi robuste qu'un vrai mot de passe — elle ne fait que satisfaire la
// contrainte technique de Supabase. La seule protection réelle contre un
// brute-force reste le rate-limiting de Supabase sur `signInWithPassword`,
// qui n'est pas conçu pour un espace aussi restreint. Pour un usage en
// production, le PIN devrait plutôt servir de verrou local (après une vraie
// authentification), pas de credential serveur unique.
export function pinToPassword(pin: string): string {
  return `dred-pin-${pin}`;
}
