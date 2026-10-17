"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { applyLocalResumeScope } from "@/lib/apply-local-resume-scope";
import { cloudSyncSessionKey } from "@/lib/cloud-sync-lifecycle";
import type { StoreState } from "@/lib/schema";

type LocalStoreScopeValue = {
  /** Firebase uid when signed in; null when signed out / guest. */
  scopeUid: string | null;
  /** Cloud sync may silently upload the current local snapshot. */
  trustForUpload: boolean;
  /**
   * Legacy / untrusted guest snapshot awaiting an explicit keep-local choice.
   * Not loaded into the uid persist bucket until confirmed.
   */
  pendingAdoptLocal: StoreState | null;
  /** Call after the user chooses "keep this device's" so future uploads are trusted. */
  markTrusted: () => void;
};

const LocalStoreScopeContext = createContext<LocalStoreScopeValue | null>(null);

/**
 * Binds the Zustand resume persist key to the current auth uid (or guest).
 * Gates children until the matching bucket is loaded so CloudSyncManager never
 * sees another account's in-memory resumes.
 */
export function LocalStoreScope({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const scopeUid = cloudSyncSessionKey(user);
  const [ready, setReady] = useState(false);
  const [trustForUpload, setTrustForUpload] = useState(false);
  const [pendingAdoptLocal, setPendingAdoptLocal] = useState<StoreState | null>(
    null
  );

  useEffect(() => {
    if (initializing) return;

    let cancelled = false;
    setReady(false);

    void (async () => {
      const applied = await applyLocalResumeScope(scopeUid);
      if (cancelled) return;
      setTrustForUpload(applied.trustForUpload);
      setPendingAdoptLocal(applied.pendingAdoptLocal);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [scopeUid, initializing]);

  const value = useMemo<LocalStoreScopeValue>(
    () => ({
      scopeUid,
      trustForUpload,
      pendingAdoptLocal,
      markTrusted: () => {
        setTrustForUpload(true);
        setPendingAdoptLocal(null);
      },
    }),
    [scopeUid, trustForUpload, pendingAdoptLocal]
  );

  if (initializing || !ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-paper" aria-busy="true">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        <span className="sr-only">Loading your resumes…</span>
      </div>
    );
  }

  return (
    <LocalStoreScopeContext.Provider value={value}>
      {children}
    </LocalStoreScopeContext.Provider>
  );
}

export function useLocalStoreScope(): LocalStoreScopeValue {
  const ctx = useContext(LocalStoreScopeContext);
  if (!ctx) {
    throw new Error("useLocalStoreScope must be used within LocalStoreScope");
  }
  return ctx;
}
