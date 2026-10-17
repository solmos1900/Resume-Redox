"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useResumeStore } from "@/lib/store";
import { useSyncStatus } from "@/lib/sync-status";
import { fetchCloudStore, saveCloudStore } from "@/lib/cloud-sync";
import {
  clearSaveDebounceTimer,
  cloudSyncSessionKey,
} from "@/lib/cloud-sync-lifecycle";
import type { StoreState } from "@/lib/schema";
import { SEED_VERSION_ID } from "@/lib/seed-data";
import { Modal } from "@/components/ui/Modal";
const SAVE_DEBOUNCE_MS = 1500;

function isUntouchedSeed(state: StoreState): boolean {
  return state.versions.length === 1 && state.versions[0].id === SEED_VERSION_ID;
}

/**
 * True when local and cloud hold the same resumes (by id + last-edited
 * time), regardless of array order. Used to skip the conflict dialog when
 * a device has already synced before and nothing has changed since.
 */
function storesAreInSync(a: StoreState, b: StoreState): boolean {
  if (a.versions.length !== b.versions.length) return false;
  const bByid = new Map(b.versions.map((v) => [v.id, v.updatedAt]));
  return a.versions.every((v) => bByid.get(v.id) === v.updatedAt);
}

export function CloudSyncManager() {
  const { user } = useAuth();
  const uid = cloudSyncSessionKey(user);
  const setSyncStatus = useSyncStatus((s) => s.set);
  const [conflict, setConflict] = useState<{
    uid: string;
    cloud: StoreState;
    local: StoreState;
  } | null>(null);

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

    if (!uid) {
      setSyncStatus("idle");
      setConflict(null);
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
      const cloud = await fetchCloudStore(uid).catch(() => null);
      if (cancelled) return;

      if (!cloud) {
        await saveCloudStore(uid, localState).catch(() => undefined);
        if (cancelled) return;
        setSyncStatus("synced");
        startAutosave(uid);
        return;
      }

      if (isUntouchedSeed(localState) || storesAreInSync(localState, cloud)) {
        useResumeStore.setState(cloud);
        setSyncStatus("synced");
        startAutosave(uid);
        return;
      }

      setConflict({ uid, cloud, local: localState });
    })();

    return () => {
      cancelled = true;
      stopAutosave();
    };
    // Key on uid only — profile-only User object replacements must not
    // re-run initial sync (see #59 / email signup displayName update).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(
    () => () => {
      stopAutosave();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
