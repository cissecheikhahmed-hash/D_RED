-- D.RED — Réactivité temps réel du tableau de bord médecin + fiche hôpital
-- 2026-07-30
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase.

-- 1. Snapshot donneur sur chaque réponse à une urgence -------------------
-- Le client médecin (clé anon) ne peut pas lire `auth.users` d'un AUTRE
-- utilisateur (le donneur) : il n'existe pas de table `profiles`/`donors`
-- lisible côté médecin. Plutôt que d'exposer une clé service_role ou une
-- fonction SECURITY DEFINER supplémentaire, on dénormalise ce dont le
-- médecin a besoin (nom, groupe sanguin, téléphone, position) directement
-- sur la ligne `emergency_responses`, écrite par le donneur lui-même au
-- moment de sa réponse (il connaît ses propres infos via sa session). Même
-- logique de contournement que `sms_notifications.phone` (20260727).
alter table public.emergency_responses add column if not exists donor_first_name text;
alter table public.emergency_responses add column if not exists donor_last_name text;
alter table public.emergency_responses add column if not exists donor_blood_group blood_group;
alter table public.emergency_responses add column if not exists donor_phone text;
alter table public.emergency_responses add column if not exists donor_lat double precision;
alter table public.emergency_responses add column if not exists donor_lng double precision;

-- 2. Le créateur d'une alerte peut la clôturer ----------------------------
-- Sert le bouton "Alerte satisfaite" : clôturer retire l'alerte du flux
-- donneur (filtré sur status = 'OPEN') en temps réel via la publication
-- ci-dessous, ce qui évite concrètement que d'autres donneurs se déplacent
-- pour rien — sans dépendre d'un vrai envoi SMS/push (toujours pas
-- implémenté, voir sms_notifications).
create policy "Le créateur peut clôturer sa propre alerte"
  on public.emergency_alerts for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- 3. Le médecin peut mettre en file un message pour ses répondants --------
-- Toujours aucun envoi réel (pas de job serveur/Twilio) : ceci ne fait que
-- permettre au créateur de l'alerte de préparer les messages en file
-- d'attente pour le jour où un traitement service role existera. Restreint
-- au créateur de l'alerte concernée (via related_alert_id) et aux rôles
-- HOSPITAL/CNTS_ADMIN.
create policy "Le créateur d'une alerte peut mettre des SMS en file"
  on public.sms_notifications for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOSPITAL', 'CNTS_ADMIN')
    and exists (
      select 1 from public.emergency_alerts ea
      where ea.id = sms_notifications.related_alert_id
        and ea.created_by = auth.uid()
    )
  );

-- 4. Realtime pour campaigns et emergency_responses -----------------------
-- Sans ceci, le donneur ne voit une nouvelle campagne qu'au prochain
-- montage de l'écran (bug remonté), et le médecin ne voit une nouvelle
-- réponse qu'en rechargeant manuellement. Idempotent.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campaigns'
  ) then
    alter publication supabase_realtime add table public.campaigns;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'emergency_responses'
  ) then
    alter publication supabase_realtime add table public.emergency_responses;
  end if;
end $$;
