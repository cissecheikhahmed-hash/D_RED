"use client";

import { useEffect } from "react";
import { initDredStore, useDredStore } from "@d-red/sync-client";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initDredStore();
  }, []);

  const connecte = useDredStore((s) => s.connecte);

  return (
    <>
      {!connecte && (
        <div className="bg-waiting py-1 text-center text-xs text-white">
          Connexion au serveur perdue — reconnexion en cours…
        </div>
      )}
      {children}
    </>
  );
}
