-- D.RED — Vérification du PIN avant envoi de l'OTP de connexion
-- (anti-harcèlement SMS)
-- 2026-07-29
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase.
--
-- Objectif : empêcher qu'un utilisateur déclenche un SMS OTP vers le
-- numéro de quelqu'un d'autre juste en tapant ce numéro sur l'écran de
-- connexion. On exige maintenant le PIN AVANT l'envoi du SMS, vérifié
-- côté serveur (le hash du PIN vit dans `raw_user_meta_data`, illisible
-- par un utilisateur non authentifié — d'où cette fonction).
--
-- ATTENTION - compromis de sécurité à connaître : cette fonction doit être
-- appelable par un utilisateur NON authentifié (`anon`), puisque c'est
-- précisément avant la connexion qu'elle sert. Un code PIN à 4 chiffres
-- n'a que 10 000 combinaisons : même avec la limitation ci-dessous (3
-- échecs puis blocage 30 min par numéro), un attaquant patient (plusieurs
-- semaines) pourrait toujours épuiser l'espace des PIN pour un numéro
-- ciblé. Cette fonction ne renvoie qu'un booléen générique (jamais
-- "numéro inconnu" vs "PIN incorrect") pour ne pas permettre de découvrir
-- quels numéros ont un compte.

create table if not exists public.pin_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

alter table public.pin_verification_attempts enable row level security;
-- Aucune policy : accès direct refusé pour anon/authenticated. Seule la
-- fonction SECURITY DEFINER ci-dessous y lit/écrit.

create index if not exists pin_verification_attempts_phone_idx
  on public.pin_verification_attempts (phone, attempted_at);

create or replace function public.verify_signin_pin(p_phone text, p_pin_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent_failures integer;
  v_stored_hash text;
  v_ok boolean;
begin
  select count(*) into v_recent_failures
  from public.pin_verification_attempts
  where phone = p_phone
    and succeeded = false
    and attempted_at > now() - interval '30 minutes';

  if v_recent_failures >= 3 then
    insert into public.pin_verification_attempts (phone, succeeded) values (p_phone, false);
    return false;
  end if;

  select raw_user_meta_data ->> 'pin_hash' into v_stored_hash
  from auth.users
  where phone = p_phone;

  v_ok := v_stored_hash is not null and v_stored_hash = p_pin_hash;

  insert into public.pin_verification_attempts (phone, succeeded) values (p_phone, v_ok);

  return v_ok;
end;
$$;

-- Appelable sans authentification (c'est le but), donc à `anon` aussi.
grant execute on function public.verify_signin_pin(text, text) to anon, authenticated;
