"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useResumeStore } from "@/lib/store";
import { useSyncStatus } from "@/lib/sync-status";
import { fetchCloudStore, saveCloudStore } from "@/lib/cloud-sync";
import {
  clearSaveDebounceTimer,
  cloudSyncSessionKey,
  planInitialCloudSync,
} from "@/lib/cloud-sync-lifecycle";
import type { StoreState } from "@/lib/schema";

const SAVE_DEBOUNCE_MS = 1500;

export function CloudSyncManager() {
  const { user } = useAuth();
  const uid = cloudSyncSessionKey(user);
  const setSyncStatus = useSyncStatus((s) => s.set);
  const [conflict, setConflict] = useState<{
    uid: string;
    cloud: StoreState;
    local: StoreState;
  } | null>(null);
  const [pausedMessage, setPausedMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);
  /** Bumps on each autosave attempt so a stale completion cannot clobber status. */
  const saveGenerationRef = useRef(0);

  const clearPendingSave = () => {
    timeoutRef.current = clearSaveDebounceTimer(timeoutRef.current);
  };

  const stopAutosave = () => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    clearPendingSave();
  };

  const startAutosave = (sessionUid: string) => {
    stopAutosave();
    unsubscribeRef.current = useResumeStore.subscribe(() => {
      clearPendingSave();
      setSyncStatus("syncing");
      timeoutRef.current = window.setTimeout(() => {
        const latest = useResumeStore.getState();
        const generation = ++saveGenerationRef.current;
        void saveCloudStore(sessionUid, {
          activeVersionId: latest.activeVersionId,
          versions: latest.versions,
        })
          .then(() => {
            if (generation === saveGenerationRef.current) {
              setSyncStatus("synced");
            }
          })
          .catch(() => {
            if (generation === saveGenerationRef.current) {
              setSyncStatus("error");
            }
          });
      }, SAVE_DEBOUNCE_MS);
    });
  };

  useEffect(() => {
    // Tear down any prior session before syncing (or idling). Clears a
    // pending debounced save so mid-flight edits are not written under the
    // wrong account, and so a same-user re-entry cannot double-save.
    stopAutosave();
    setPausedMessage(null);
    setConflict(null);

    if (!uid) {
      setSyncStatus("idle");
      return;
    }

    let cancelled = false;

    (async () => {
      setSyncStatus("syncing");
      const local = useResumeStore.getState();
      const localState: StoreState = {
        activeVersionId: local.activeVersionId,
        versions: local.versions,
      };
      const fetchResult = await fetchCloudStore(uid);
      if (cancelled) return;

      const plan = planInitialCloudSync(fetchResult, localState);

      if (plan.action === "seed-local") {
        await saveCloudStore(uid, localState).catch(() => undefined);
        if (cancelled) return;
        setSyncStatus("synced");
        startAutosave(uid);
        return;
      }

      if (plan.action === "block") {
        // Do not write. Do not start autosave. Preserve local + cloud.
        setPausedMessage(plan.message);
        setSyncStatus("paused");
        return;
      }

      if (plan.action === "adopt-cloud") {
        useResumeStore.setState(plan.cloud);
        setSyncStatus("synced");
        startAutosave(uid);
        return;
      }

      setConflict({ uid, cloud: plan.cloud, local: plan.local });
    })();

    return () => {
      cancelled = true;
      stopAutosave();
    };
    // Key on uid only — profile-only User object replacements must not
    // re-run initial sync (see #59 / email signup displayName update).
    // retryToken intentionally re-runs a paused sync after the user retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, retryToken]);

  useEffect(
    () => () => {
      stopAutosave();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (pausedMessage) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
        <div
          className="rounded-xl border border-amber-200 bg-white px-4 py-3 shadow-lg"
          role="status"
        >
          <p className="text-sm font-semibold text-gray-900">
            Cloud sync paused
          </p>
          <p className="mt-1 text-sm text-gray-600">{pausedMessage}</p>
          <p className="mt-1 text-xs text-gray-500">
            Resumes on this device and in your account are both left as-is.
          </p>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setRetryToken((n) => n + 1)}
              className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!conflict) return null;

  const useCloud = () => {
    useResumeStore.setState(conflict.cloud);
    setSyncStatus("synced");
    startAutosave(conflict.uid);
    setConflict(null);
  };

  const keepLocal = () => {
    void saveCloudStore(conflict.uid, conflict.local).then(() =>
      setSyncStatus("synced")
    );
    startAutosave(conflict.uid);
    setConflict(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Resumes found in your account
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            This device also has unsaved resumes. Which version should we
            keep?
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={keepLocal}
            className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Keep this device&apos;s resumes
          </button>
          <button
            type="button"
            onClick={useCloud}
            className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Use my account&apos;s resumes
          </button>
        </div>
      </div>
    </div>
  );
}
