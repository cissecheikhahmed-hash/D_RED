"use client";

import { AppShell, type AppShellNavItem } from "@/components/app-shell";

const NAV: AppShellNavItem[] = [
  { href: "/cnts/wc-01", label: "Supervision" },
  { href: "/cnts/wc-03", label: "Politiques" },
  { href: "/cnts/wc-04", label: "Console labo" },
];

export default function CntsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="CNTS — Régulation nationale" nav={NAV}>
      {children}
    </AppShell>
  );
}
