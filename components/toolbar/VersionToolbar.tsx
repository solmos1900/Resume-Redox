"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { createPrintSession, openPrintPreview } from "@/lib/export";
import { DownloadMenu } from "./DownloadMenu";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { useSyncStatus } from "@/lib/sync-status";

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VersionToolbar() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const [printing, setPrinting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [savedAtLabel, setSavedAtLabel] = useState<string | null>(null);
  const prevUpdatedAtRef = useRef<string | undefined>(undefined);
  const prevVersionIdRef = useRef<string | undefined>(undefined);
  const syncStatus = useSyncStatus((s) => s.status);

  useEffect(() => {
    const updatedAt = version?.updatedAt;
    const versionId = version?.id;

    if (!updatedAt || !versionId) {
      setSaveStatus("idle");
      setSavedAtLabel(null);
      prevUpdatedAtRef.current = undefined;
      prevVersionIdRef.current = undefined;
      return;
    }

    const label = formatSavedAt(updatedAt);
    const switchedResume = prevVersionIdRef.current !== versionId;
    prevVersionIdRef.current = versionId;

    if (switchedResume || prevUpdatedAtRef.current === undefined) {
      prevUpdatedAtRef.current = updatedAt;
      setSaveStatus("saved");
      setSavedAtLabel(label);
      return;
    }

    if (prevUpdatedAtRef.current === updatedAt) return;

    prevUpdatedAtRef.current = updatedAt;
    setSaveStatus("saving");

    const timeout = window.setTimeout(() => {
      setSaveStatus("saved");
      setSavedAtLabel(label);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [version?.updatedAt, version?.id]);

  const showStatus = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 4000);
  };

  const handlePrint = () => {
    if (!version) return;
    setPrinting(true);
    setStatus(null);
    try {
      const token = createPrintSession(version);
      openPrintPreview(token);
      showStatus(
        "Print preview opened. Disable “Headers and footers” if your browser shows them."
      );
    } catch (error) {
      showStatus(
        error instanceof Error ? error.message : "Print failed."
      );
    } finally {
      setPrinting(false);
    }
  };

  return (
    <>
      <header className="no-print flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Resume Redox</h1>
          {version && (
            <p className="text-xs text-gray-500 mt-0.5">
              Editing: {version.name}
              {version.contact.fullName.trim() &&
                ` · ${version.contact.fullName}`}
            </p>
          )}
          {version && saveStatus === "saving" && (
            <p className="text-xs text-gray-400 mt-0.5" aria-live="polite">
              Saving…
            </p>
          )}
          {version && saveStatus === "saved" && savedAtLabel && (
            <p className="text-xs text-gray-400 mt-0.5" aria-live="polite">
              Saved {savedAtLabel}
              {syncStatus === "syncing" && " · Syncing…"}
              {syncStatus === "synced" && " · Synced"}
              {syncStatus === "error" && " · Sync failed"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <span className="text-xs text-gray-500 mr-2 max-w-xs text-right">
              {status}
            </span>
          )}
          <AccountMenu />
          <DownloadMenu version={version} onStatus={showStatus} />
          <button
            type="button"
            onClick={handlePrint}
            disabled={!version || printing}
            className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 font-medium"
          >
            {printing ? "Opening..." : "Print"}
          </button>
        </div>
      </header>
    </>
  );
}
