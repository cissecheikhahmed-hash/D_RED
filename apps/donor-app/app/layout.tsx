import type { Metadata } from "next";
import { Poppins, Anton } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "D.RED — Donneur",
  description: "D.RED — Digital Blood Response & Exchange Directory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${anton.variable} antialiased`}
    >
      {/* Sur desktop (fenêtre de démo côte à côte avec l'app Infrastructure),
          l'app mobile s'affiche dans un cadre téléphone centré sur fond noir
          profond ; sur mobile elle reste plein écran. */}
      <body className="flex min-h-dvh flex-col md:items-center md:justify-center md:gap-3 md:bg-ink md:p-8">
        <div className="flex min-h-dvh w-full flex-col bg-background md:min-h-0 md:h-[calc(100dvh-6rem)] md:max-h-[56rem] md:max-w-sm md:overflow-y-auto md:rounded-[2rem] md:border md:border-ink-soft md:shadow-2xl">
          <Providers>{children}</Providers>
        </div>
        <p className="hidden font-display text-sm tracking-wide text-white/40 md:block">
          D.RED — Application Donneur
        </p>
      </body>
    </html>
  );
}
