"use client";

import { useEffect } from "react";
import { initDredStore } from "@d-red/sync-client";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initDredStore();
  }, []);

  return <>{children}</>;
}
