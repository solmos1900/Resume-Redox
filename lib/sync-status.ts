import { create } from "zustand";

/**
 * - idle: signed out / not syncing
 * - syncing: pull or push in flight
 * - synced: cloud and local aligned; autosave active
 * - error: a cloud *write* failed; next edit will retry
 * - paused: cloud *read* failed (network/permission/schema); writes blocked
 *   so we never overwrite an unreadable account document (issue #43)
 */
type SyncStatus = "idle" | "syncing" | "synced" | "error" | "paused";

export const useSyncStatus = create<{
  status: SyncStatus;
  set: (status: SyncStatus) => void;
}>((set) => ({
  status: "idle",
  set: (status) => set({ status }),
}));
