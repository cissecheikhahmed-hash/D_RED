// Crée (ou réutilise) un compte de démo médecin/CNTS pour tester
// doctor-mobile sans provisioning manuel. À exécuter une fois :
//
//   node apps/doctor-mobile/scripts/create-demo-account.mjs
//
// Utilise l'anon key (comme l'app elle-même) : ne fonctionne que parce que
// signUp() est une opération publique de Supabase Auth. Si la confirmation
// d'email est active sur le projet, il faudra confirmer ce compte
// manuellement dans le Dashboard Supabase (Authentication > Users) avant de
// pouvoir s'y connecter.

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquants dans .env');
  process.exit(1);
}

const DEMO_EMAIL = 'demo.cnts@d-red.test';
const DEMO_PASSWORD = 'DemoCnts2026!';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { data, error } = await supabase.auth.signUp({
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  options: {
    data: {
      first_name: 'Démo',
      last_name: 'CNTS',
      role: 'CNTS_ADMIN',
    },
  },
});

if (error) {
  if (error.message.includes('already registered')) {
    console.log(`Le compte ${DEMO_EMAIL} existe déjà — rien à faire.`);
  } else {
    console.error('Erreur :', error.message);
    process.exit(1);
  }
} else if (!data.session) {
  console.log(
    `Compte ${DEMO_EMAIL} créé, mais aucune session renvoyée : la confirmation d'email est` +
      ` probablement active sur ce projet. Confirme-le manuellement dans le Dashboard Supabase` +
      ` (Authentication > Users > ${DEMO_EMAIL} > Confirm) avant de t'y connecter.`,
  );
} else {
  console.log(`Compte ${DEMO_EMAIL} créé et déjà utilisable (confirmation d'email désactivée).`);
}

console.log(`\nEmail    : ${DEMO_EMAIL}`);
console.log(`Password : ${DEMO_PASSWORD}`);
