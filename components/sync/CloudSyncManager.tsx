"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocalStoreScope } from "@/components/sync/LocalStoreScope";
import { useResumeStore } from "@/lib/store";
import { useSyncStatus } from "@/lib/sync-status";
import { fetchCloudStore, saveCloudStore } from "@/lib/cloud-sync";
import {
  clearSaveDebounceTimer,
  cloudSyncSessionKey,
  planInitialCloudSync,
} from "@/lib/cloud-sync-lifecycle";
import { markLocalTrustedForUid } from "@/lib/apply-local-resume-scope";
import { maySilentUploadToEmptyCloud } from "@/lib/local-resume-scope";
import type { StoreState } from "@/lib/schema";
import { createInitialStore } from "@/lib/seed-data";
import { Modal } from "@/components/ui/Modal";

const SAVE_DEBOUNCE_MS = 1500;

export function CloudSyncManager() {
  const { user } = useAuth();
  const uid = cloudSyncSessionKey(user);
  const { trustForUpload, pendingAdoptLocal, markTrusted } =
    useLocalStoreScope();
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
      const storeLocal: StoreState = {
        activeVersionId: local.activeVersionId,
        versions: local.versions,
      };
      // Discriminated fetch: missing vs invalid vs error vs ok (#43 / #80).
      const fetchResult = await fetchCloudStore(uid);
      if (cancelled) return;

      // Legacy untrusted guest is held aside until the user confirms (#76 / #82).
      if (pendingAdoptLocal) {
        if (
          fetchResult.status === "invalid" ||
          fetchResult.status === "error"
        ) {
          setPausedMessage(
            fetchResult.status === "invalid"
              ? fetchResult.reason
              : fetchResult.message
          );
          setSyncStatus("paused");
          return;
        }
        setConflict({
          uid,
          cloud:
            fetchResult.status === "ok"
              ? fetchResult.data
              : createInitialStore(),
          local: pendingAdoptLocal,
        });
        return;
      }

      const plan = planInitialCloudSync(fetchResult, storeLocal);

      if (plan.action === "seed-local") {
        // Never upload another account's local data into an empty cloud doc.
        if (
          !maySilentUploadToEmptyCloud({
            local: storeLocal,
            trustForUpload,
          })
        ) {
          // Defensive: scoping should have left seed here. Do not push
          // untrusted non-seed resumes into the cloud.
          useResumeStore.setState(createInitialStore());
          setSyncStatus("synced");
          startAutosave(uid);
          return;
        }
        await saveCloudStore(uid, storeLocal).catch(() => undefined);
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
    // LocalStoreScope remounts this tree when the uid (or guest) scope
    // finishes loading, so trust flags are fresh on each mount without
    // re-listing them as deps (that would re-sync after "keep local").
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
    markLocalTrustedForUid(conflict.uid);
    markTrusted();
    setSyncStatus("synced");
    startAutosave(conflict.uid);
    setConflict(null);
  };

  const keepLocal = () => {
    // Explicit user choice: this device's snapshot now belongs to this uid.
    useResumeStore.setState(conflict.local);
    markLocalTrustedForUid(conflict.uid);
    markTrusted();
    void saveCloudStore(conflict.uid, conflict.local).then(() =>
      setSyncStatus("synced")
    );
    startAutosave(conflict.uid);
    setConflict(null);
  };

  const count = (n: number) => `${n} resume${n === 1 ? "" : "s"}`;

  return (
    <Modal
      open
      hideClose
      onClose={() => undefined}
      title="Which resumes should we keep?"
      description={`Your account has ${count(conflict.cloud.versions.length)} saved, and this device has ${count(conflict.local.versions.length)} that aren't in your account yet.`}
      footer={
        <>
          <button type="button" onClick={keepLocal} className="btn btn-secondary">
            Keep this device&apos;s
          </button>
          <button type="button" onClick={useCloud} className="btn btn-primary" data-autofocus>
            Use my account&apos;s
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">
        Whichever set you don&apos;t choose is overwritten, so pick the one
        with your latest edits.
      </p>
    </Modal>
  );
}
