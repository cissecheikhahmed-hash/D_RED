import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY doivent être définis dans apps/doctor-mobile/.env (voir .env.example).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Volontairement sans persistance : un poste médical est souvent
    // partagé entre plusieurs membres du personnel, donc chaque lancement
    // de l'app doit redemander les identifiants plutôt que de rouvrir la
    // session de la dernière personne connectée.
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
