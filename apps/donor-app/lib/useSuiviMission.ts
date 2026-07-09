"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import type { MissionStatus } from "@d-red/types";

/**
 * Écrans du parcours autorisés pour chaque statut de mission — le premier de
 * la liste est la cible quand l'écran courant n'est plus cohérent avec l'état
 * serveur. Plusieurs écrans peuvent partager un statut (le donneur navigue
 * librement entre eux : MD-07/MD-08 pendant NOTIFIED, MD-11/MD-12 pendant
 * EN_ROUTE) ; on ne redirige donc jamais tant que l'écran courant reste
 * autorisé, ce qui garantit que la navigation manuelle n'est pas écrasée.
 * Les statuts terminaux (REFUSED/EJECTED/CANCELLED) renvoient au dashboard.
 */
const ECRANS_PAR_STATUT: Partial<Record<MissionStatus, readonly string[]>> = {
  NOTIFIED: ["md-07", "md-08"],
  PRE_RESERVED: ["md-09"],
  EN_ROUTE: ["md-11", "md-12"],
  ARRIVED: ["md-13"],
  DONATION_COMPLETED: ["md-13"],
};

/**
 * En Mode Autonome, personne ne clique "Je suis arrivé(e)" : après quelques
 * secondes de guidage, la fenêtre donneur avance d'elle-même vers le QR.
 * Progression d'écran mono-acteur uniquement — la transition métier ARRIVED
 * reste déclenchée côté serveur (scan WH-05 simulé).
 */
const DELAI_ARRIVEE_AUTONOME_MS = 5_000;

/**
 * Auto-suivi du parcours donneur : maintient l'écran affiché en phase avec
 * le statut serveur de la mission, quel que soit l'acteur qui l'a fait
 * avancer (clic CNTS/hôpital, Mode Autonome, ou rechargement tardif de la
 * page alors que des statuts ont été sautés). À brancher sur chaque écran
 * de mission (MD-07 à MD-13).
 */
export function useSuiviMission(missionId: string): void {
  const router = useRouter();
  const pathname = usePathname();
  const mission = useDredStore((s) => s.missions.find((m) => m.id === missionId));
  const autonomieActive = useDredStore((s) => s.autonomieActive);

  const status = mission?.status;
  const ecranCourant = pathname.split("/")[1] ?? "";

  useEffect(() => {
    if (!status) return; // mission inconnue : l'écran gère son propre état vide
    const autorises = ECRANS_PAR_STATUT[status];
    if (!autorises) {
      router.push("/md-06");
    } else if (!autorises.includes(ecranCourant)) {
      router.push(`/${autorises[0]}/${missionId}`);
    }
  }, [status, ecranCourant, missionId, router]);

  useEffect(() => {
    if (!autonomieActive || status !== "EN_ROUTE" || ecranCourant !== "md-11") return;
    const timer = setTimeout(
      () => router.push(`/md-12/${missionId}`),
      DELAI_ARRIVEE_AUTONOME_MS,
    );
    return () => clearTimeout(timer);
  }, [autonomieActive, status, ecranCourant, missionId, router]);
}
