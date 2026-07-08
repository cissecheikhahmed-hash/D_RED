/**
 * Illustrations dessinées à la main (SVG inline) — pas d'images externes,
 * cohérent avec la contrainte "zéro dépendance réseau" déjà appliquée à la
 * carte simulée et aux polices auto-hébergées. Palette D.RED uniquement.
 */

interface IllustrationProps {
  className?: string;
}

/** Logo goutte de sang stylisée — brand kit officiel D.RED, utilisée sur MD-01 (fond rouge). */
export function BloodDropMark({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 120" className={className} fill="none" aria-hidden="true">
      <path
        d="M50 4C50 4 14 58 14 84C14 104.9 30.1 120 50 120C69.9 120 86 104.9 86 84C86 58 50 4 50 4Z"
        fill="white"
      />
      <ellipse cx="38" cy="82" rx="9" ry="15" fill="var(--color-dred)" opacity="0.16" />
    </svg>
  );
}

/** MD-02 slide 1 — alerte donneur : téléphone + notification goutte, ondes de pulsation. */
export function AlerteIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <circle cx="82" cy="40" r="20" fill="none" stroke="var(--color-dred)" strokeWidth="2" opacity="0.35" />
      <circle cx="82" cy="40" r="13" fill="none" stroke="var(--color-dred)" strokeWidth="2" opacity="0.55" />
      <rect x="38" y="30" width="34" height="58" rx="7" fill="white" stroke="var(--color-ink)" strokeWidth="2" />
      <rect x="44" y="38" width="22" height="34" rx="2" fill="var(--color-beige)" />
      <circle cx="55" cy="80" r="3" fill="var(--color-ink)" />
      <path
        d="M82 30C82 30 74 39 74 45.5C74 50.19 77.8 54 82 54C86.2 54 90 50.19 90 45.5C90 39 82 30 82 30Z"
        fill="var(--color-dred)"
      />
    </svg>
  );
}

/** MD-02 slide 2 — disponibilité : épingle de position + interrupteur. */
export function DisponibiliteIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <path
        d="M60 26C47.85 26 38 35.85 38 48C38 65 60 88 60 88C60 88 82 65 82 48C82 35.85 72.15 26 60 26Z"
        fill="var(--color-dred)"
      />
      <circle cx="60" cy="48" r="9" fill="white" />
      <rect x="34" y="92" width="52" height="20" rx="10" fill="white" stroke="var(--color-ink)" strokeWidth="2" />
      <circle cx="72" cy="102" r="7" fill="var(--color-dred)" />
    </svg>
  );
}

/** MD-02 slide 3 — donneurs vérifiés : bouclier + coche + petits repères de réseau. */
export function VerifieIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <circle cx="30" cy="40" r="5" fill="var(--color-dred)" opacity="0.4" />
      <circle cx="92" cy="46" r="4" fill="var(--color-dred)" opacity="0.4" />
      <circle cx="88" cy="86" r="5" fill="var(--color-dred)" opacity="0.4" />
      <path
        d="M60 28L84 37V56C84 74 74 87 60 92C46 87 36 74 36 56V37L60 28Z"
        fill="white"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <path
        d="M49 60L57 68L73 50"
        fill="none"
        stroke="var(--color-dred)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** MD-11 — guidage : silhouette urbaine, route en pointillés, marqueur de destination. */
export function GuidageIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 320 180" className={className} aria-hidden="true">
      <rect x="0" y="0" width="320" height="180" fill="var(--color-beige)" />
      <g opacity="0.5" fill="var(--color-ink)">
        <rect x="20" y="90" width="24" height="50" />
        <rect x="52" y="70" width="20" height="70" />
        <rect x="250" y="60" width="22" height="80" />
        <rect x="278" y="85" width="24" height="55" />
      </g>
      <path
        d="M20 150 Q 100 60 160 100 T 300 40"
        fill="none"
        stroke="var(--color-dred)"
        strokeWidth="4"
        strokeDasharray="10 8"
        strokeLinecap="round"
      />
      <circle cx="20" cy="150" r="7" fill="var(--color-ink)" />
      <path
        d="M300 20C300 20 286 34 286 43.5C286 51.5 292.3 58 300 58C307.7 58 314 51.5 314 43.5C314 34 300 20 300 20Z"
        fill="var(--color-dred)"
      />
    </svg>
  );
}

/** MD-13 — clôture/gratification : goutte + coche + confettis. */
export function CelebrationIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <rect x="24" y="24" width="8" height="8" rx="2" fill="var(--color-dred)" opacity="0.5" transform="rotate(18 28 28)" />
      <rect x="88" y="30" width="7" height="7" rx="2" fill="var(--color-success)" opacity="0.6" transform="rotate(-12 91 33)" />
      <circle cx="30" cy="88" r="4" fill="var(--color-waiting)" opacity="0.7" />
      <circle cx="94" cy="82" r="5" fill="var(--color-dred)" opacity="0.4" />
      <path
        d="M60 30C60 30 40 60 40 76C40 87.05 48.95 96 60 96C71.05 96 80 87.05 80 76C80 60 60 30 60 30Z"
        fill="var(--color-dred)"
      />
      <path
        d="M51 76L58 83L71 68"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
