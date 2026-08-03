import type { User } from '@supabase/supabase-js';

// Fiche établissement du médecin connecté : pré-configurée par le CNTS à la
// création du compte (voir scripts/create-demo-account.mjs), stockée dans
// `user_metadata` — pas de table `hospitals`/`profiles` dans ce projet
// aujourd'hui. Le médecin ne saisit jamais ces champs lui-même.
export type HospitalProfile = {
  name: string;
  address: string | null;
  lat: number;
  lng: number;
};

export function getHospitalProfile(user: User): HospitalProfile | null {
  const metadata = user.user_metadata ?? {};
  const name = metadata.hospital_name;
  const lat = metadata.hospital_lat;
  const lng = metadata.hospital_lng;
  if (typeof name !== 'string' || !name.trim()) return null;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return {
    name,
    address: typeof metadata.hospital_address === 'string' ? metadata.hospital_address : null,
    lat,
    lng,
  };
}
