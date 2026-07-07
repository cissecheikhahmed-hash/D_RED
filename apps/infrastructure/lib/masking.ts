/**
 * Masque l'identité du donneur côté Hôpital (WH-04) — le CNTS (WC-02) voit
 * le nom complet, l'établissement demandeur non : chacun son besoin d'en
 * connaître, par décision produit (Phase 5).
 */
export function masquerNom(nom: string): string {
  const parties = nom.trim().split(/\s+/);
  if (parties.length < 2) return nom;
  const [prenom, ...reste] = parties;
  const nomFamille = reste[reste.length - 1]!;
  return `${prenom![0]}. ${nomFamille.toUpperCase()}`;
}
