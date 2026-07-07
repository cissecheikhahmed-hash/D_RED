"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "dred:donneur-session";
export const TELEPHONE_TEMP_KEY = "dred:telephone-temp";

export interface DonneurSession {
  telephone: string;
  donneurId: string | null;
  nomSaisi: string | null;
}

const SESSION_VIDE: DonneurSession = { telephone: "", donneurId: null, nomSaisi: null };

function lireSessionStockee(): DonneurSession {
  if (typeof window === "undefined") return SESSION_VIDE;
  const brut = localStorage.getItem(STORAGE_KEY);
  return brut ? (JSON.parse(brut) as DonneurSession) : SESSION_VIDE;
}

/**
 * Identité locale au navigateur — aucune vraie authentification. Permet au
 * présentateur de changer de "personnage donneur" entre deux passages de
 * démo simplement en vidant la session. Ces écrans sont toujours atteints
 * par navigation client (jamais un lien profond direct), donc l'initialiseur
 * paresseux de `useState` peut lire le stockage sans provoquer de
 * désynchronisation d'hydratation.
 */
export function useDonneurSession() {
  const [session, setSessionState] = useState<DonneurSession>(lireSessionStockee);

  const setSession = useCallback((next: DonneurSession) => {
    setSessionState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(SESSION_VIDE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { session, setSession, clearSession };
}
