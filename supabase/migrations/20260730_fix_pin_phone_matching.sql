-- D.RED — Corrige le PIN toujours refusé à la connexion
-- 2026-07-30
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase.
--
-- Cause réelle du bug "PIN invalide" systématique : `verify_signin_pin`
-- (migration 20260729) compare `auth.users.phone` à `p_phone` par égalité
-- stricte de chaînes. Le client envoie toujours le numéro avec un `+`
-- initial (`normalizePhone` dans AuthScreen.tsx), mais GoTrue (Supabase
-- Auth) stocke `auth.users.phone` SANS le `+` (convention interne de
-- Supabase pour la colonne `phone`, indépendante de ce qu'on envoie à
-- `signInWithOtp`/`verifyOtp`). Résultat : la ligne n'était jamais trouvée,
-- donc `v_stored_hash` restait `null` et la fonction renvoyait `false`
-- quel que soit le PIN saisi — ce n'était pas un problème de hachage
-- (`hashPin` est la même fonction des deux côtés, donc déjà symétrique par
-- construction) ni de type de colonne (le PIN est stocké haché dans
-- `raw_user_meta_data` en JSONB, pas dans une colonne `profiles.pin`
-- numérique — ce projet n'a pas de table `profiles`).
--
-- Correctif : ne comparer que les chiffres des deux côtés (insensible à un
-- `+`, des espaces ou tirets éventuels), plutôt que de parier sur un format
-- de stockage précis.
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
  v_phone_digits text := regexp_replace(p_phone, '\D', '', 'g');
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
  where regexp_replace(phone, '\D', '', 'g') = v_phone_digits;

  v_ok := v_stored_hash is not null and v_stored_hash = p_pin_hash;

  insert into public.pin_verification_attempts (phone, succeeded) values (p_phone, v_ok);

  return v_ok;
end;
$$;

grant execute on function public.verify_signin_pin(text, text) to anon, authenticated;
