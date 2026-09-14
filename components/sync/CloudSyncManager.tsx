"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useResumeStore } from "@/lib/store";
import { useSyncStatus } from "@/lib/sync-status";
import { fetchCloudStore, saveCloudStore } from "@/lib/cloud-sync";

const SAVE_DEBOUNCE_MS = 1500;

export function CloudSyncManager() {
  const { user } = useAuth();
  const setSyncStatus = useSyncStatus((s) => s.set);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const startAutosave = (uid: string) => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = useResumeStore.subscribe((state) => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setSyncStatus("syncing");
      timeoutRef.current = window.setTimeout(() => {
        void saveCloudStore(uid, {
          activeVersionId: state.activeVersionId,
          versions: state.versions,
        })
          .then(() => setSyncStatus("synced"))
          .catch(() => setSyncStatus("error"));
      }, SAVE_DEBOUNCE_MS);
    });
  };

  useEffect(() => {
    if (!user) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setSyncStatus("idle");
      return;
    }

    let cancelled = false;

    (async () => {
      setSyncStatus("syncing");
      const cloud = await fetchCloudStore(user.uid).catch(() => null);
      if (cancelled) return;

      if (cloud) {
        // Account data is always the source of truth; anything left in
        // local storage (a prior account's session, a stale device) is
        // disregarded once an account has cloud resumes.
        useResumeStore.setState(cloud);
      } else {
        // First login for this account: seed the cloud from whatever is
        // currently in the store (e.g. the default seed resume).
        const local = useResumeStore.getState();
        await saveCloudStore(user.uid, {
          activeVersionId: local.activeVersionId,
          versions: local.versions,
        }).catch(() => undefined);
      }

      setSyncStatus("synced");
      startAutosave(user.uid);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(
    () => () => {
      unsubscribeRef.current?.();
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    []
  );

  return null;
}
