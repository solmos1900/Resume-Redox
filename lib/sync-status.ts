import { create } from "zustand";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

export const useSyncStatus = create<{
  status: SyncStatus;
  set: (status: SyncStatus) => void;
}>((set) => ({
  status: "idle",
  set: (status) => set({ status }),
}));
