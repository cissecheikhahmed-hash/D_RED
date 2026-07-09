#!/usr/bin/env node
/**
 * Pré-télécharge les tuiles OSM de la zone de démo (Dakar + Thiès) dans
 * public/tiles/{z}/{x}/{y}.png, pour que la carte MD-11 fonctionne sans
 * aucune requête réseau pendant une démo live (contrainte du brief).
 *
 * À lancer une seule fois (les tuiles sont committées) ; ne retélécharge
 * pas une tuile déjà présente. Throttlé + User-Agent identifiable pour
 * respecter la politique d'usage des serveurs OSM.
 *
 * Usage : node scripts/download-tiles.mjs
 */

import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "tiles");
const USER_AGENT = "D.RED-prototype/1.0 (demo hackathon; fall.cmf@ept.edu.sn)";
const PAUSE_MS = 120;

/**
 * Zones à couvrir : le corridor complet en zooms larges (vue d'ensemble),
 * puis le détail urbain là où vivent réellement donneurs et établissements.
 * bbox = [latSud, lngOuest, latNord, lngEst]
 */
const ZONES = [
  { nom: "corridor Dakar-Thiès", bbox: [14.55, -17.55, 14.9, -16.8], zooms: [10, 11, 12] },
  { nom: "Dakar détail", bbox: [14.6, -17.53, 14.82, -17.25], zooms: [13, 14] },
  { nom: "Thiès détail", bbox: [14.72, -17.02, 14.86, -16.83], zooms: [13, 14] },
];

function lngVersX(lng, z) {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}

function latVersY(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * 2 ** z);
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function existe(chemin) {
  try {
    await access(chemin);
    return true;
  } catch {
    return false;
  }
}

let telechargees = 0;
let dejaPresentes = 0;
let echecs = 0;

for (const { nom, bbox, zooms } of ZONES) {
  const [latSud, lngOuest, latNord, lngEst] = bbox;
  for (const z of zooms) {
    const xMin = lngVersX(lngOuest, z);
    const xMax = lngVersX(lngEst, z);
    const yMin = latVersY(latNord, z); // y croît vers le sud
    const yMax = latVersY(latSud, z);
    console.log(`${nom} — z${z} : ${(xMax - xMin + 1) * (yMax - yMin + 1)} tuiles`);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const chemin = join(RACINE, String(z), String(x), `${y}.png`);
        if (await existe(chemin)) {
          dejaPresentes++;
          continue;
        }
        const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        try {
          const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          await mkdir(dirname(chemin), { recursive: true });
          await writeFile(chemin, Buffer.from(await res.arrayBuffer()));
          telechargees++;
        } catch (erreur) {
          echecs++;
          console.error(`  ✗ ${z}/${x}/${y} : ${erreur.message}`);
        }
        await pause(PAUSE_MS);
      }
    }
  }
}

console.log(
  `\nTerminé : ${telechargees} téléchargées, ${dejaPresentes} déjà présentes, ${echecs} échecs.`,
);
if (echecs > 0) process.exitCode = 1;
