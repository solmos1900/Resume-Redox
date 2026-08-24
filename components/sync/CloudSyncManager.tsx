"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useResumeStore } from "@/lib/store";
import { useSyncStatus } from "@/lib/sync-status";
import { fetchCloudStore, saveCloudStore } from "@/lib/cloud-sync";
import type { StoreState } from "@/lib/schema";

const SEED_VERSION_ID = "seed-technical-pm";
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
  const setSyncStatus = useSyncStatus((s) => s.set);
  const [conflict, setConflict] = useState<{
    uid: string;
    cloud: StoreState;
    local: StoreState;
  } | null>(null);

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
      const cloud = await fetchCloudStore(user.uid).catch(() => null);
      if (cancelled) return;

      if (!cloud) {
        await saveCloudStore(user.uid, localState).catch(() => undefined);
        setSyncStatus("synced");
        startAutosave(user.uid);
        return;
      }

      if (isUntouchedSeed(localState) || storesAreInSync(localState, cloud)) {
        useResumeStore.setState(cloud);
        setSyncStatus("synced");
        startAutosave(user.uid);
        return;
      }

      setConflict({ uid: user.uid, cloud, local: localState });
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
