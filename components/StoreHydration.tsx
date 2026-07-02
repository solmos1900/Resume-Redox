"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useResumeStore } from "@/lib/store";

export function StoreHydration({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useResumeStore.persist.rehydrate();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading resume...
      </div>
    );
  }

  return <>{children}</>;
}
