"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "dred:etablissement-session";

function lireEtablissementId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Identité locale au navigateur pour la fenêtre "Établissement" (Hôpital /
 * Banque de sang / Clinique privée) — aucune vraie authentification. Le
 * présentateur choisit l'établissement joué par cette fenêtre sur WH-01.
 */
export function useEtablissementSession() {
  const [etablissementId, setEtablissementIdState] = useState<string | null>(lireEtablissementId);

  const setEtablissementId = useCallback((id: string) => {
    setEtablissementIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const clearEtablissementId = useCallback(() => {
    setEtablissementIdState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { etablissementId, setEtablissementId, clearEtablissementId };
}
