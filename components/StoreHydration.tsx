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
      <div className="auth-shell box-border flex min-h-dvh items-center justify-center text-gray-500 text-sm">
        Loading resume...
      </div>
    );
  }

  return <>{children}</>;
}
