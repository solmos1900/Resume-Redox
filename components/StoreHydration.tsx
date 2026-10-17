"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";
import { migrateLegacyResumeStorage } from "@/lib/apply-local-resume-scope";

export function StoreHydration({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Move the pre-scoping shared key into the guest bucket (untrusted)
      // before the first guest rehydrate so we never load it under a uid.
      migrateLegacyResumeStorage();
      await Promise.resolve(useResumeStore.persist.rehydrate());
      await Promise.resolve(useUiStore.persist.rehydrate());
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
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
