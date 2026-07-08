import type { GroupeSanguin } from "@d-red/types";
import { cn } from "../lib/utils.js";

type Taille = "sm" | "md" | "lg" | "hero";

const TAILLE_CLASSES: Record<Taille, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  hero: "text-8xl",
};

interface GroupeSanguinTagProps {
  groupe: GroupeSanguin;
  taille?: Taille | undefined;
  className?: string | undefined;
}

/**
 * Groupe sanguin en Anton rouge — signature typographique de la marque,
 * avec une échelle fixe pour que le même élément ait la même taille d'un
 * écran à l'autre (liste = md, titre de page = lg, fiche mission = hero).
 */
export function GroupeSanguinTag({ groupe, taille = "md", className }: GroupeSanguinTagProps) {
  return (
    <span className={cn("font-display leading-none text-dred", TAILLE_CLASSES[taille], className)}>
      {groupe}
    </span>
  );
}
