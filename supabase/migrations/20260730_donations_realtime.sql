-- D.RED — Realtime sur `donations` pour la modale de félicitations donneur
-- 2026-07-30
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase.
--
-- Sans ceci, l'app donneur ne peut détecter la validation d'un don par le
-- médecin (`validate_donation` RPC, migration 20260729) qu'en rechargeant
-- l'écran. La policy SELECT "Un donneur peut lire ses propres dons"
-- (migration 20260728) existe déjà et suffit pour le filtrage RLS des
-- événements Realtime — rien à changer côté policies, juste la
-- publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'donations'
  ) then
    alter publication supabase_realtime add table public.donations;
  end if;
end $$;
