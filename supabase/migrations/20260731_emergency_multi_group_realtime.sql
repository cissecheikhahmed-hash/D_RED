-- D.RED — Groupes sanguins multiples + type de besoin sur les urgences,
-- activation du Realtime pour affichage instantané côté donneur
-- 2026-07-31
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase.

-- `blood_group` (singulier) reste en place pour compatibilité mais n'est
-- plus renseigné par le formulaire médecin — remplacé par `blood_groups`
-- (tableau, null = tous groupes / urgence universelle), sur le même modèle
-- que `campaigns.blood_groups`.
alter table public.emergency_alerts add column if not exists blood_groups blood_group[];
alter table public.emergency_alerts add column if not exists need_type text;

-- "Me désister" : le donneur doit pouvoir retirer sa propre réponse.
drop policy if exists "Un donneur peut retirer sa réponse" on public.emergency_responses;
create policy "Un donneur peut retirer sa réponse"
  on public.emergency_responses for delete
  to authenticated
  using (donor_id = auth.uid());

-- Realtime : sans ceci, le donneur ne voit une nouvelle alerte qu'au
-- prochain montage de l'écran (pas "instantané"). Idempotent : ne plante
-- pas si la table est déjà dans la publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'emergency_alerts'
  ) then
    alter publication supabase_realtime add table public.emergency_alerts;
  end if;
end $$;
