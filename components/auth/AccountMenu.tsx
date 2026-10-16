"use client";

import { useAuth } from "./AuthProvider";
import { useUiStore } from "@/lib/ui-store";
import { useSyncStatus } from "@/lib/sync-status";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { IconCloud } from "@/components/ui/icons";

const SYNC_LABEL = {
  idle: "Sync is on",
  syncing: "Syncing…",
  synced: "All changes synced",
  error: "Sync failed — we'll retry on your next edit",
} as const;

/** "Sync" button when signed out; avatar menu when signed in. Hidden if auth isn't configured. */
export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { user, configured, initializing, signOutUser } = useAuth();
  const openSignIn = useUiStore((s) => s.openSignIn);
  const syncStatus = useSyncStatus((s) => s.status);

  if (!configured || initializing) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn()}
        className={compact ? "btn-icon" : "btn btn-ghost btn-sm"}
        aria-label="Sign in to sync across devices"
        title="Sign in to sync across devices"
      >
        <IconCloud />
        {!compact && <span className="hidden md:inline">Sync</span>}
      </button>
    );
  }

  const label = user.displayName || user.email || "Account";
  const initial = label.charAt(0).toUpperCase();

  return (
    <Menu
      width="w-72"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Account menu"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
            {initial}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                syncStatus === "error" ? "bg-red-500" : syncStatus === "syncing" ? "bg-amber-400" : "bg-moss-500"
              }`}
              aria-hidden
            />
          </span>
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-3 pb-2 pt-2">
            <p className="truncate text-sm font-semibold text-ink">{label}</p>
            {user.email && user.displayName && (
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
              <IconCloud size={14} /> {SYNC_LABEL[syncStatus]}
            </p>
          </div>
          <div className="my-1 h-px bg-line" />
          <MenuItem
            label="Sign out"
            hint="Resumes stay on this device."
            onClick={() => {
              close();
              void signOutUser();
            }}
          />
        </>
      )}
    </Menu>
  );
}
