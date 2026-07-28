-- D.RED — Table `donations` (validation réelle d'un don après scan du pass)
-- 2026-07-28
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase. Comme pour
-- campaigns/emergency_alerts (20260727), table neuve plutôt que de deviner
-- une structure existante : `donations` n'existait pas du tout au moment
-- d'écrire ce fichier (vérifié via une requête depuis le client).
--
-- Limite connue : cette table enregistre le don, mais NE met PAS à jour
-- `last_donation_date` dans `user_metadata` du donneur (ce champ n'est
-- modifiable que par le donneur lui-même via auth.updateUser — un médecin
-- ne peut pas écrire dans le compte d'un autre utilisateur avec la clé
-- anonyme). Tant que ça n'est pas résolu (table `donors` réelle + policy,
-- ou Edge Function service role), l'éligibilité calculée côté donneur ne
-- se met pas à jour automatiquement après un don validé ici.

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references auth.users(id),
  blood_group blood_group not null,
  donated_at timestamptz not null default now(),
  validated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.donations enable row level security;

create policy "Hôpital/CNTS peuvent enregistrer un don"
  on public.donations for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOSPITAL', 'CNTS_ADMIN')
  );

create policy "Hôpital/CNTS peuvent lire tous les dons"
  on public.donations for select
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOSPITAL', 'CNTS_ADMIN')
  );

create policy "Un donneur peut lire ses propres dons"
  on public.donations for select
  to authenticated
  using (donor_id = auth.uid());
