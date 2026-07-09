import { formatDateFr } from "@d-red/utils";

/**
 * Carte de don partageable — dessinée entièrement sur <canvas> (aucune lib,
 * aucune requête réseau : couleurs lues depuis les tokens CSS, polices déjà
 * auto-hébergées par next/font). Format carré 1080×1080, universel sur les
 * réseaux sociaux, exporté en vrai PNG via toBlob.
 */

export interface CarteDonData {
  nom: string;
  groupeSanguin: string;
  niemeDon: number;
  dateISO: string;
  lieu: string;
}

export const TAILLE_CARTE = 1080;

/** Filet de sécurité si les variables CSS sont indisponibles — mêmes valeurs que tokens.css. */
const FALLBACK_COULEURS = {
  ink: "#0b0b0d",
  dred: "#a50606",
  beige: "#f8efd7",
  white: "#ffffff",
} as const;

/** Même tracé que BloodDropMark (components/illustrations.tsx), viewBox 100×120. */
const TRACE_GOUTTE =
  "M50 4C50 4 14 58 14 84C14 104.9 30.1 120 50 120C69.9 120 86 104.9 86 84C86 58 50 4 50 4Z";

function couleurToken(nom: keyof typeof FALLBACK_COULEURS): string {
  const valeur = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${nom}`)
    .trim();
  return valeur || FALLBACK_COULEURS[nom];
}

/** next/font expose la famille réelle (nom hashé) dans la variable CSS. */
function familleToken(variable: string, fallback: string): string {
  const valeur = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return valeur || fallback;
}

function troncature(ctx: CanvasRenderingContext2D, texte: string, largeurMax: number): string {
  if (ctx.measureText(texte).width <= largeurMax) return texte;
  let coupe = texte;
  while (coupe.length > 1 && ctx.measureText(`${coupe}…`).width > largeurMax) {
    coupe = coupe.slice(0, -1);
  }
  return `${coupe.trimEnd()}…`;
}

function dessinerGoutte(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hauteur: number,
  fill: string,
): void {
  const echelle = hauteur / 120;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(echelle, echelle);
  ctx.fillStyle = fill;
  ctx.fill(new Path2D(TRACE_GOUTTE));
  ctx.restore();
}

function libelleNiemeDon(niemeDon: number): string {
  return niemeDon === 1 ? "1ᵉʳ don" : `${niemeDon}ᵉ don`;
}

export async function dessinerCarteDon(
  canvas: HTMLCanvasElement,
  data: CarteDonData,
): Promise<void> {
  canvas.width = TAILLE_CARTE;
  canvas.height = TAILLE_CARTE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const ink = couleurToken("ink");
  const dred = couleurToken("dred");
  const beige = couleurToken("beige");
  const blanc = couleurToken("white");
  const anton = familleToken("--font-anton", "Anton, sans-serif");
  const poppins = familleToken("--font-poppins", "Poppins, sans-serif");

  // Sans ce préchargement, le premier dessin retombe sur la police système.
  await Promise.all([
    document.fonts.load(`400 10px ${anton}`),
    document.fonts.load(`600 10px ${poppins}`),
  ]).catch(() => undefined);

  const marge = 90;

  // Fond + grande goutte décorative débordant du cadre.
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, TAILLE_CARTE, TAILLE_CARTE);
  ctx.save();
  ctx.globalAlpha = 0.18;
  dessinerGoutte(ctx, 660, -140, 900, dred);
  ctx.restore();

  // En-tête : marque D.RED.
  dessinerGoutte(ctx, marge, marge - 8, 76, dred);
  ctx.fillStyle = blanc;
  ctx.font = `400 60px ${anton}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("D.RED", marge + 84, marge + 52);

  // Pastille groupe sanguin.
  const groupeY = 350;
  ctx.font = `400 92px ${anton}`;
  const largeurGroupe = ctx.measureText(data.groupeSanguin).width;
  ctx.fillStyle = dred;
  ctx.beginPath();
  ctx.roundRect(marge, groupeY, largeurGroupe + 96, 150, 28);
  ctx.fill();
  ctx.fillStyle = blanc;
  ctx.fillText(data.groupeSanguin, marge + 48, groupeY + 108);

  // Message principal.
  ctx.fillStyle = blanc;
  ctx.font = `400 176px ${anton}`;
  ctx.fillText(
    troncature(ctx, libelleNiemeDon(data.niemeDon), TAILLE_CARTE - marge * 2),
    marge,
    720,
  );
  ctx.fillStyle = beige;
  ctx.font = `600 58px ${poppins}`;
  ctx.fillText(troncature(ctx, data.nom, TAILLE_CARTE - marge * 2), marge, 810);

  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = blanc;
  ctx.font = `400 40px ${poppins}`;
  ctx.fillText(
    troncature(ctx, `${formatDateFr(data.dateISO)} · ${data.lieu}`, TAILLE_CARTE - marge * 2),
    marge,
    880,
  );
  ctx.restore();

  // Bandeau de signature.
  const bandeauHauteur = 120;
  ctx.fillStyle = beige;
  ctx.fillRect(0, TAILLE_CARTE - bandeauHauteur, TAILLE_CARTE, bandeauHauteur);
  ctx.fillStyle = ink;
  ctx.font = `400 44px ${anton}`;
  ctx.fillText("CHAQUE DON COMPTE", marge, TAILLE_CARTE - 42);
  dessinerGoutte(ctx, TAILLE_CARTE - marge - 50, TAILLE_CARTE - bandeauHauteur + 24, 72, dred);
}

export function exporterPngDepuisCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export PNG impossible"))),
      "image/png",
    );
  });
}
