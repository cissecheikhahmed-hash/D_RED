"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlerteIllustration,
  DisponibiliteIllustration,
  VerifieIllustration,
} from "@/components/illustrations";

const SLIDES = [
  {
    Illustration: AlerteIllustration,
    titre: "Sauvez des vies en quelques minutes",
    texte: "D.RED vous alerte quand un hôpital a besoin de votre groupe sanguin, à proximité.",
  },
  {
    Illustration: DisponibiliteIllustration,
    titre: "Uniquement quand vous êtes disponible",
    texte: "Vous choisissez votre disponibilité. Aucune sollicitation si vous êtes en veille.",
  },
  {
    Illustration: VerifieIllustration,
    titre: "Un réseau de donneurs vérifiés",
    texte: "Votre statut de donneur vérifié est confirmé en personne lors d'un don ou d'une campagne.",
  },
];

/** MD-02 — Onboarding (carrousel local, 3 slides). */
export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const Illustration = slide.Illustration;
  const dernier = index === SLIDES.length - 1;

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col justify-between p-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <Illustration className="size-40" />
        <h1 className="text-2xl font-semibold">{slide.titre}</h1>
        <p className="max-w-sm text-muted-foreground">{slide.texte}</p>
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === index ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => (dernier ? router.push("/md-03") : setIndex((i) => i + 1))}
        >
          {dernier ? "Commencer" : "Suivant"}
        </Button>
        {!dernier && (
          <Button variant="ghost" onClick={() => router.push("/md-03")}>
            Passer
          </Button>
        )}
      </div>
    </main>
  );
}
