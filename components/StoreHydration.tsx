"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";

export function StoreHydration({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useResumeStore.persist.rehydrate();
    useUiStore.persist.rehydrate();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-paper" aria-busy="true">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        <span className="sr-only">Loading your resumes…</span>
      </div>
    );
  }

  return <>{children}</>;
}
