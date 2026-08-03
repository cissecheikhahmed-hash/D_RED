-- D.RED — Réassertion de la policy de lecture publique sur `campaigns`
-- 2026-07-30
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase.
--
-- Le bug "les campagnes ne s'affichent pas chez le donneur" venait en
-- réalité d'un filtrage client trop strict (rayon de diffusion appliqué
-- comme masque plutôt que comme simple tri — corrigé dans
-- CampaignsSection.tsx), pas de la RLS. Cette policy existait déjà depuis
-- la migration 20260727 ; on la réaffirme ici de façon idempotente
-- (DROP + CREATE) par précaution, au cas où son exécution initiale aurait
-- échoué silencieusement sur ce projet.
drop policy if exists "Tout utilisateur authentifié peut lire les campagnes" on public.campaigns;
create policy "Tout utilisateur authentifié peut lire les campagnes"
  on public.campaigns for select
  to authenticated
  using (true);
