"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";
import { useSyncStatus } from "@/lib/sync-status";
import { useAuth } from "@/components/auth/AuthProvider";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { DownloadMenu } from "@/components/toolbar/DownloadMenu";
import { useIsDesktop } from "@/lib/use-media-query";
import { resumeDisplayName } from "@/lib/utils";
import { IconArrowLeft, IconCheck, IconPencil } from "@/components/ui/icons";

/** "Saving… / Saved" — every edit persists to this browser immediately. */
function SaveIndicator({ updatedAt }: { updatedAt: string }) {
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const sync = useSyncStatus((s) => s.status);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaving(true);
    const t = setTimeout(() => setSaving(false), 600);
    return () => clearTimeout(t);
  }, [updatedAt]);

  let label = "Saved on this device";
  if (saving) label = "Saving…";
  else if (user && sync === "syncing") label = "Syncing…";
  else if (user && sync === "error") label = "Saved here · sync failed";
  else if (user && sync === "paused") label = "Saved here · sync paused";
  else if (user) label = "Saved & synced";

  return (
    <span className="flex items-center gap-1 text-[12px] text-ink-faint" aria-live="polite">
      {!saving && <IconCheck size={12} className="text-moss-500" />}
      {label}
    </span>
  );
}

export function EditorTopBar() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const renameVersion = useResumeStore((s) => s.renameVersion);
  const openHome = useUiStore((s) => s.openHome);
  const isDesktop = useIsDesktop(640);
  const shownName = version ? resumeDisplayName(version) : "";
  const [draft, setDraft] = useState(shownName);

  useEffect(() => {
    setDraft(shownName);
  }, [version?.id, shownName]);

  const commit = () => {
    if (!version) return;
    const next = draft.trim();
    if (next && next !== shownName) renameVersion(version.id, next);
    else setDraft(shownName);
  };

  return (
    <header className="no-print relative z-30 flex shrink-0 items-center gap-2 border-b border-line bg-paper/90 px-2 py-2 backdrop-blur sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={openHome}
        className="btn btn-ghost btn-sm shrink-0 px-2.5"
        aria-label="Back to my resumes"
      >
        <IconArrowLeft size={17} />
        <span className="hidden md:inline">My resumes</span>
      </button>
      <div className="hidden h-6 w-px bg-line md:block" aria-hidden />

      {version && (
        <div className="min-w-0 flex-1">
          <label className="group relative flex max-w-md items-center">
            <span className="sr-only">Resume name</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setDraft(shownName);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full truncate rounded-lg border border-transparent bg-transparent px-2 py-0.5 font-display text-[16px] font-semibold tracking-tight text-ink transition hover:border-line focus:border-brand-500 focus:bg-white focus:outline-none sm:text-[17px]"
              placeholder="Name this resume"
            />
            <IconPencil
              size={13}
              className="pointer-events-none absolute right-2 text-ink-faint opacity-0 transition group-hover:opacity-100"
            />
          </label>
          <div className="px-2">
            <SaveIndicator key={version.id} updatedAt={version.updatedAt} />
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <AccountMenu compact={!isDesktop} />
        <DownloadMenu version={version} compact={!isDesktop} />
      </div>
    </header>
  );
}
