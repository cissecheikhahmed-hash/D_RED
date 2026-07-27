-- D.RED — Campagnes programmées + Alertes d'urgence + téléphone donneur
-- 2026-07-27
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase (ou via la CLI si
-- elle est liée au projet). Ce fichier n'a jamais été exécuté par
-- l'assistant : il n'a pas d'accès direct à la base (pas de clé
-- service_role). Vérifie qu'il n'entre pas en conflit avec des objets déjà
-- présents avant de l'exécuter.
--
-- Choix volontaire : ce fichier crée deux tables NEUVES (`campaigns` et
-- `emergency_alerts`) plutôt que de modifier `blood_requests`, dont le
-- schéma exact (colonnes, contraintes) n'a jamais été communiqué à
-- l'assistant — modifier une table à l'aveugle aurait été risqué. À
-- terme, ces deux tables pourraient être fusionnées avec `blood_requests`
-- une fois son schéma réel connu.
--
-- Suppose l'existence du type énuméré `blood_group` (mentionné dans le
-- schéma initial : A+, A-, B+, B-, AB+, AB-, O+, O-). Adapter le nom si
-- besoin.

-- 1. Téléphone donneur -------------------------------------------------
-- L'app donor-mobile stocke aujourd'hui le profil donneur (prénom, nom,
-- téléphone, groupe sanguin, sexe, date du dernier don...) dans
-- `auth.users.raw_user_meta_data`, PAS dans une table relationnelle — donc
-- cette colonne ne sert que si/quand une vraie table `donors` existe et
-- que le flux d'inscription y écrit réellement (pas encore le cas).
-- Décommenter et adapter le nom de table une fois cette table confirmée :
--
-- alter table public.donors add column if not exists phone text;

-- 2. Campagnes programmées ---------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  blood_groups blood_group[] null, -- null = tous les groupes ciblés
  scheduled_at timestamptz not null,
  location_label text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  radius_km integer not null check (radius_km in (2, 5, 10, 25)),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create policy "Hôpital/CNTS peuvent créer des campagnes"
  on public.campaigns for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOSPITAL', 'CNTS_ADMIN')
  );

create policy "Tout utilisateur authentifié peut lire les campagnes"
  on public.campaigns for select
  to authenticated
  using (true);

-- 3. Alertes d'urgence ---------------------------------------------------
create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  blood_group blood_group not null,
  units_needed integer not null check (units_needed > 0),
  radius_km integer not null default 10, -- fixe côté produit, pas configurable
  origin_lat double precision not null,
  origin_lng double precision not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.emergency_alerts enable row level security;

create policy "Hôpital/CNTS peuvent créer des alertes d'urgence"
  on public.emergency_alerts for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOSPITAL', 'CNTS_ADMIN')
  );

create policy "Tout utilisateur authentifié peut lire les alertes"
  on public.emergency_alerts for select
  to authenticated
  using (true);

-- 4. Notifications push (modèle de données uniquement) ------------------
-- Enregistre le token Expo Push de chaque donneur. Aucune app ne
-- l'alimente encore (donor-mobile n'a pas expo-notifications) — préparé
-- pour une future intégration.
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.push_tokens enable row level security;

create policy "Un utilisateur gère son propre token push"
  on public.push_tokens for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 5. File d'attente SMS (modèle de données uniquement) -------------------
-- Prépare l'envoi de SMS direct aux donneurs concernés par une alerte,
-- via leur numéro de téléphone. Aucun envoi réel n'est implémenté : il
-- faudrait un job/Edge Function côté serveur (avec service role) qui lit
-- cette file et appelle un fournisseur SMS (Twilio ou équivalent) — pas
-- fait ici, pas de clé fournisseur disponible. Volontairement sans policy
-- RLS d'accès client : seul un traitement serveur (service role) doit lire
-- ou écrire cette table.
create table if not exists public.sms_notifications (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references auth.users(id),
  phone text not null,
  message text not null,
  related_alert_id uuid, -- campaigns.id ou emergency_alerts.id, sans FK (deux sources possibles)
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.sms_notifications enable row level security;
-- Aucune policy créée : accès refusé par défaut pour les rôles
-- authenticated/anon, réservé à un traitement service role côté serveur.
