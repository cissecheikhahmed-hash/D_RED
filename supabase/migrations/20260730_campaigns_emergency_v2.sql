-- D.RED — Champs manquants pour campagnes/urgences + réponses aux urgences
-- 2026-07-30
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase.
--
-- Ajouts additifs uniquement (ADD COLUMN IF NOT EXISTS, nullable) sur les
-- tables `campaigns`/`emergency_alerts` créées le 2026-07-27 : pas de
-- risque de casser des lignes existantes. La validation "obligatoire" de
-- ces champs se fait côté formulaire (CampaignModal/EmergencyAlertModal),
-- pas via une contrainte NOT NULL rétroactive.

alter table public.campaigns add column if not exists description text;
alter table public.campaigns add column if not exists ends_at timestamptz;

alter table public.emergency_alerts add column if not exists title text;
alter table public.emergency_alerts add column if not exists description text;
alter table public.emergency_alerts add column if not exists location_label text;
alter table public.emergency_alerts add column if not exists ends_at timestamptz;

-- Réponses des donneurs à une urgence ("Je viens donner"). Permet au
-- médecin/CNTS de savoir qui a répondu à une alerte.
create table if not exists public.emergency_responses (
  id uuid primary key default gen_random_uuid(),
  emergency_id uuid not null references public.emergency_alerts(id) on delete cascade,
  donor_id uuid not null references auth.users(id),
  responded_at timestamptz not null default now(),
  unique (emergency_id, donor_id)
);

alter table public.emergency_responses enable row level security;

create policy "Un donneur peut répondre à une urgence"
  on public.emergency_responses for insert
  to authenticated
  with check (donor_id = auth.uid());

create policy "Un donneur peut voir ses propres réponses"
  on public.emergency_responses for select
  to authenticated
  using (donor_id = auth.uid());

create policy "Hôpital/CNTS peuvent voir toutes les réponses"
  on public.emergency_responses for select
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOSPITAL', 'CNTS_ADMIN')
  );
