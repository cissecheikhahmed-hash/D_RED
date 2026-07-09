/**
 * Illustrations dessinées à la main (SVG inline) — pas d'images externes,
 * cohérent avec la contrainte "zéro dépendance réseau" déjà appliquée aux
 * tuiles de carte locales et aux polices auto-hébergées. Palette D.RED
 * uniquement.
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

/** MD-03 — saisie du téléphone : combiné avec clavier numérique et goutte en badge d'appli. */
export function TelephoneIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <circle cx="30" cy="42" r="4" fill="var(--color-dred)" opacity="0.35" />
      <circle cx="92" cy="80" r="5" fill="var(--color-dred)" opacity="0.3" />
      <rect x="42" y="22" width="36" height="76" rx="8" fill="white" stroke="var(--color-ink)" strokeWidth="2" />
      <rect x="48" y="30" width="24" height="14" rx="3" fill="var(--color-beige)" />
      {[0, 1, 2].map((ligne) =>
        [0, 1, 2].map((colonne) => (
          <circle
            key={`${ligne}-${colonne}`}
            cx={52 + colonne * 8}
            cy={56 + ligne * 10}
            r="2.6"
            fill="var(--color-ink)"
            opacity="0.55"
          />
        )),
      )}
      <circle cx="60" cy="88" r="3" fill="var(--color-ink)" />
      <path
        d="M86 20C86 20 78 29 78 35.5C78 40.19 81.8 44 86 44C90.2 44 94 40.19 94 35.5C94 29 86 20 86 20Z"
        fill="var(--color-dred)"
      />
    </svg>
  );
}

/** MD-04 — code OTP : bulle de message avec code à 4 points, ondes d'envoi. */
export function OtpIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <circle cx="26" cy="78" r="4" fill="var(--color-dred)" opacity="0.35" />
      <path d="M88 76 A20 20 0 0 1 88 96" fill="none" stroke="var(--color-dred)" strokeWidth="2" opacity="0.35" />
      <path d="M93 71 A27 27 0 0 1 93 101" fill="none" stroke="var(--color-dred)" strokeWidth="2" opacity="0.2" />
      <rect x="26" y="36" width="68" height="36" rx="10" fill="white" stroke="var(--color-ink)" strokeWidth="2" />
      <path d="M42 71L38 84L54 71Z" fill="white" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={40 + i * 13.5} cy="54" r="4" fill={i < 3 ? "var(--color-ink)" : "var(--color-dred)"} />
      ))}
      <path
        d="M86 16C86 16 79 24 79 29.5C79 33.6 82.1 37 86 37C89.9 37 93 33.6 93 29.5C93 24 86 16 86 16Z"
        fill="var(--color-dred)"
      />
    </svg>
  );
}

/** MD-09 — régulation CNTS : casque d'opérateur avec micro et ondes d'appel. */
export function RegulationIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <path d="M92 44 A26 26 0 0 1 92 76" fill="none" stroke="var(--color-dred)" strokeWidth="2" opacity="0.35" />
      <path d="M98 38 A34 34 0 0 1 98 82" fill="none" stroke="var(--color-dred)" strokeWidth="2" opacity="0.2" />
      <circle cx="24" cy="40" r="4" fill="var(--color-dred)" opacity="0.35" />
      <path
        d="M34 62C34 46.5 45.6 34 60 34C74.4 34 86 46.5 86 62"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="28" y="58" width="12" height="22" rx="6" fill="var(--color-dred)" stroke="var(--color-ink)" strokeWidth="2" />
      <rect x="80" y="58" width="12" height="22" rx="6" fill="var(--color-dred)" stroke="var(--color-ink)" strokeWidth="2" />
      <path
        d="M86 80C86 88 78 92 68 92"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="64" cy="92" r="5" fill="white" stroke="var(--color-ink)" strokeWidth="2" />
    </svg>
  );
}

/** MD-10 — récompenses : médaille au ruban avec goutte gravée, confettis. */
export function RecompensesIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <rect x="24" y="30" width="8" height="8" rx="2" fill="var(--color-dred)" opacity="0.5" transform="rotate(18 28 34)" />
      <rect x="90" y="36" width="7" height="7" rx="2" fill="var(--color-success)" opacity="0.6" transform="rotate(-14 93 39)" />
      <circle cx="30" cy="86" r="4" fill="var(--color-waiting)" opacity="0.7" />
      <path d="M46 18L54 44L66 44L58 18Z" fill="var(--color-dred)" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M74 18L66 44L54 44L62 18Z" fill="white" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="60" cy="68" r="24" fill="white" stroke="var(--color-ink)" strokeWidth="2" />
      <circle cx="60" cy="68" r="18" fill="none" stroke="var(--color-dred)" strokeWidth="2" opacity="0.35" />
      <path
        d="M60 56C60 56 52 66 52 71.5C52 76.2 55.8 80 60 80C64.2 80 68 76.2 68 71.5C68 66 60 56 60 56Z"
        fill="var(--color-dred)"
      />
    </svg>
  );
}

/** MD-14 — historique : carnet de dons validés, tampon goutte. */
export function HistoriqueIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="var(--color-beige)" />
      <circle cx="26" cy="38" r="4" fill="var(--color-dred)" opacity="0.35" />
      <circle cx="94" cy="34" r="5" fill="var(--color-success)" opacity="0.4" />
      <rect x="32" y="26" width="52" height="70" rx="7" fill="white" stroke="var(--color-ink)" strokeWidth="2" />
      <rect x="48" y="20" width="20" height="12" rx="4" fill="var(--color-beige)" stroke="var(--color-ink)" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path
            d={`M40 ${46 + i * 14}l3.5 3.5L50 ${43 + i * 14}`}
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="56" y={45 + i * 14} width="20" height="4" rx="2" fill="var(--color-beige)" />
        </g>
      ))}
      <circle cx="86" cy="90" r="16" fill="white" stroke="var(--color-ink)" strokeWidth="2" />
      <path
        d="M86 80C86 80 79 88 79 93C79 97.4 82.1 100.5 86 100.5C89.9 100.5 93 97.4 93 93C93 88 86 80 86 80Z"
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
