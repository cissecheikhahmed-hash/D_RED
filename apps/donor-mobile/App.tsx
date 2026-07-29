import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { AuthScreen } from './screens/AuthScreen';
import { CompleteProfileScreen } from './screens/CompleteProfileScreen';
import { DonorDashboardScreen } from './screens/DonorDashboardScreen';
import { SetPinScreen } from './screens/SetPinScreen';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  function renderContent() {
    if (!session) return <AuthScreen />;
    // Après vérification OTP (inscription ou compte migré sans PIN), on
    // force la définition du PIN avant d'accéder au tableau de bord.
    if (!session.user.user_metadata?.pin_hash) return <SetPinScreen />;
    // Filet de sécurité : un compte créé avant `shouldCreateUser: false`
    // (ou tout autre cas où l'inscription n'a pas abouti) peut avoir un PIN
    // mais aucun profil donneur. On force sa complétion avant le dashboard.
    if (!session.user.user_metadata?.blood_group) return <CompleteProfileScreen />;
    return <DonorDashboardScreen session={session} />;
  }

  return (
    <>
      {renderContent()}
      <StatusBar style="auto" />
    </>
  );
}
