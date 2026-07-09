"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

interface Point {
  lat: number;
  lng: number;
}

interface RouteMapProps {
  depart: Point;
  arrivee: Point;
  className?: string | undefined;
}

/** Emprise et zooms couverts par les tuiles locales (voir scripts/download-tiles.mjs). */
const LIMITES_ZONE_DEMO: [[number, number], [number, number]] = [
  [14.45, -17.65],
  [15.0, -16.7],
];
const ZOOM_MIN = 10;
const ZOOM_MAX = 14;

const HTML_MARQUEUR_DEPART = `
  <span class="relative flex size-6 items-center justify-center">
    <span class="absolute inline-flex size-full animate-ping rounded-full bg-dred/30"></span>
    <span class="relative inline-flex size-3.5 rounded-full bg-dred ring-2 ring-white"></span>
  </span>`;

const HTML_MARQUEUR_ARRIVEE = `
  <svg viewBox="0 0 34 44" width="34" height="44" aria-hidden="true">
    <path d="M17 2C9.3 2 3 8.3 3 16C3 27 17 42 17 42C17 42 31 27 31 16C31 8.3 24.7 2 17 2Z"
      fill="var(--color-dred)" stroke="white" stroke-width="2.5" />
    <circle cx="17" cy="16" r="5.5" fill="white" />
  </svg>`;

/**
 * Carte MD-11 sur tuiles OSM servies depuis public/tiles — aucune requête
 * réseau à l'exécution (contrainte démo live). L'itinéraire reste une ligne
 * simulée : pas de vrai calcul de trajet, comme le reste du prototype.
 */
export function RouteMap({ depart, arrivee, className }: RouteMapProps) {
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const conteneur = conteneurRef.current;
    if (!conteneur) return;

    let carte: LeafletMap | undefined;
    let annule = false;

    // Import dynamique : Leaflet touche `window` dès son évaluation, donc
    // jamais au rendu serveur.
    void import("leaflet").then((L) => {
      if (annule) return;

      carte = L.map(conteneur, {
        zoomControl: false,
        minZoom: ZOOM_MIN,
        maxZoom: ZOOM_MAX,
        maxBounds: LIMITES_ZONE_DEMO,
        maxBoundsViscosity: 1,
      });
      carte.attributionControl.setPrefix(false);

      L.tileLayer("/tiles/{z}/{x}/{y}.png", {
        minZoom: ZOOM_MIN,
        maxZoom: ZOOM_MAX,
        attribution: "© OpenStreetMap",
      }).addTo(carte);

      L.polyline(
        [
          [depart.lat, depart.lng],
          [arrivee.lat, arrivee.lng],
        ],
        { color: "var(--color-dred)", weight: 4, dashArray: "10 8", lineCap: "round" },
      ).addTo(carte);

      L.marker([depart.lat, depart.lng], {
        icon: L.divIcon({ html: HTML_MARQUEUR_DEPART, className: "", iconSize: [24, 24], iconAnchor: [12, 12] }),
        keyboard: false,
      }).addTo(carte);
      L.marker([arrivee.lat, arrivee.lng], {
        icon: L.divIcon({ html: HTML_MARQUEUR_ARRIVEE, className: "", iconSize: [34, 44], iconAnchor: [17, 42] }),
        keyboard: false,
      }).addTo(carte);

      carte.fitBounds(
        L.latLngBounds([depart.lat, depart.lng], [arrivee.lat, arrivee.lng]),
        { padding: [40, 40] },
      );
    });

    return () => {
      annule = true;
      carte?.remove();
    };
  }, [depart.lat, depart.lng, arrivee.lat, arrivee.lng]);

  return <div ref={conteneurRef} className={cn("z-0 h-full w-full bg-secondary", className)} />;
}
