"use client";

import { useEffect, useState } from "react";

/**
 * Horloge re-rendue à intervalle fixe — alimente les libellés relatifs
 * ("il y a 3 min") pour qu'ils vieillissent à l'écran sans interaction.
 * Purement visuel et local : aucune étape métier n'en dépend.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
