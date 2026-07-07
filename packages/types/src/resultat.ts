/**
 * Bilan post-don. Envoyé au donneur par "canal sécurisé externe" (email
 * chiffré simulé) — jamais affiché en clair dans l'app, conformément à la
 * décision Phase 3 (pas d'espace personnel interne pour le bilan).
 */
export interface ResultatAnalyse {
  id: string;
  missionId: string;
  donneurId: string;
  envoyeAt: string;
  /** Libellé simulé, ex. "Bilan envoyé à j***@exemple.com" — pas de vrai contenu médical. */
  canalEnvoiSimule: string;
}
