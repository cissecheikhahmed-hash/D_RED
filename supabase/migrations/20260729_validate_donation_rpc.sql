-- D.RED — Fonction RPC pour valider un don (contourne la restriction
-- d'écriture cross-utilisateur sur user_metadata)
-- 2026-07-29
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL Supabase.
--
-- Problème : un médecin/CNTS ne peut pas modifier `raw_user_meta_data` d'un
-- AUTRE utilisateur (donneur) via la clé anon — Supabase ne l'autorise que
-- pour l'utilisateur lui-même (`auth.updateUser`). SECURITY DEFINER fait
-- tourner cette fonction avec les privilèges de son propriétaire (postgres),
-- qui PEUT écrire dans `auth.users` — c'est la voie officielle Supabase
-- pour ce genre de contournement contrôlé, à la place d'exposer une clé
-- service_role côté client (ce qu'on a explicitement évité jusqu'ici).
--
-- Sécurité : SECURITY DEFINER bypass RLS entièrement, donc le contrôle de
-- rôle (HOSPITAL/CNTS_ADMIN) est fait explicitement DANS la fonction —
-- sans ça, n'importe quel utilisateur authentifié pourrait appeler cette
-- fonction pour modifier la date de dernier don de n'importe quel donneur.

create or replace function public.validate_donation(
  p_donor_id uuid,
  p_blood_group blood_group
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_donation_id uuid;
begin
  v_caller_role := (auth.jwt() -> 'user_metadata' ->> 'role');
  if v_caller_role is null or v_caller_role not in ('HOSPITAL', 'CNTS_ADMIN') then
    raise exception 'Non autorisé : rôle HOSPITAL ou CNTS_ADMIN requis';
  end if;

  if not exists (select 1 from auth.users where id = p_donor_id) then
    raise exception 'Donneur introuvable';
  end if;

  insert into public.donations (donor_id, blood_group, validated_by)
  values (p_donor_id, p_blood_group, auth.uid())
  returning id into v_donation_id;

  update auth.users
  set raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('last_donation_date', to_char(current_date, 'YYYY-MM-DD'))
  where id = p_donor_id;

  return v_donation_id;
end;
$$;

-- Seuls les utilisateurs authentifiés peuvent appeler cette fonction (le
-- contrôle de rôle HOSPITAL/CNTS_ADMIN est fait à l'intérieur, ci-dessus).
grant execute on function public.validate_donation(uuid, blood_group) to authenticated;
