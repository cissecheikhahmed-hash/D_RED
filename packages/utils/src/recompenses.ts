export interface Palier {
  nom: string;
  seuilMin: number;
}

/**
 * Paliers de fidélité calculés à la volée à partir de `Donneur.nombreDonsEffectues`
 * — pas de nouvel état serveur, le palier est une simple fonction pure du
 * compteur déjà existant (cohérent avec le choix "compteur simple" plutôt
 * qu'un système de récompenses à état complexe).
 */
export const PALIERS: Palier[] = [
  { nom: "Bronze", seuilMin: 0 },
  { nom: "Argent", seuilMin: 3 },
  { nom: "Or", seuilMin: 6 },
  { nom: "Platine", seuilMin: 10 },
];

export function trouverPalier(nombreDons: number): Palier {
  const trouve = [...PALIERS].reverse().find((p) => nombreDons >= p.seuilMin);
  return trouve ?? PALIERS[0]!;
}

export function prochainPalier(nombreDons: number): Palier | undefined {
  return PALIERS.find((p) => p.seuilMin > nombreDons);
}
