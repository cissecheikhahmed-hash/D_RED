"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "dred:etablissement-session";

/**
 * Petit store module-level : chaque composant qui consomme le hook voit le
 * même identifiant et se re-rend dès qu'il change (un useState par instance
 * laissait le layout figé sur l'ancienne valeur après connexion sur WH-01).
 */
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Identité locale au navigateur pour la fenêtre "Établissement" (Hôpital /
 * Banque de sang / Clinique privée) — aucune vraie authentification. Le
 * présentateur choisit l'établissement joué par cette fenêtre sur WH-01.
 */
export function useEtablissementSession() {
  const etablissementId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setEtablissementId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    emit();
  }, []);

  const clearEtablissementId = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emit();
  }, []);

  return { etablissementId, setEtablissementId, clearEtablissementId };
}
