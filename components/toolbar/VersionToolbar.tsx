"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import type { ResumeVersion } from "@/lib/schema";
import {
  createPrintSession,
  openPrintPreview,
  saveResumeAsPdf,
} from "@/lib/export";
import {
  downloadStoreBackup,
  importStoreFromFile,
} from "@/lib/file-persistence";

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

type ImportMode = "add" | "replace";

export function VersionToolbar() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const activeVersionId = useResumeStore((s) => s.activeVersionId);
  const versions = useResumeStore((s) => s.versions);
  const importVersions = useResumeStore((s) => s.importVersions);
  const replaceActiveWithImported = useResumeStore(
    (s) => s.replaceActiveWithImported
  );
  const importInputRef = useRef<HTMLInputElement>(null);
  const [printing, setPrinting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [savedAtLabel, setSavedAtLabel] = useState<string | null>(null);
  const prevUpdatedAtRef = useRef<string | undefined>(undefined);
  const prevVersionIdRef = useRef<string | undefined>(undefined);

  const [pendingImport, setPendingImport] = useState<ResumeVersion[] | null>(
    null
  );
  const [importMode, setImportMode] = useState<ImportMode>("add");

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

  const handleSavePdf = () => {
    if (!version) return;
    try {
      saveResumeAsPdf(version);
      showStatus("Print dialog opened — choose “Save as PDF”.");
    } catch (error) {
      showStatus(
        error instanceof Error ? error.message : "Could not open print preview."
      );
    }
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

  const handleBackupJson = () => {
    downloadStoreBackup({ activeVersionId, versions });
    showStatus("JSON backup downloaded.");
  };

  const handleImportFileSelected = async (file: File) => {
    const imported = await importStoreFromFile(file);
    if (!imported || imported.length === 0) {
      showStatus("Import failed. Check the JSON file.");
      return;
    }
    setImportMode("add");
    setPendingImport(imported);
  };

  const closeImportDialog = () => {
    setPendingImport(null);
    setImportMode("add");
  };

  const confirmImport = () => {
    if (!pendingImport || pendingImport.length === 0) return;

    if (importMode === "replace") {
      const ok = replaceActiveWithImported(pendingImport[0]);
      closeImportDialog();
      if (!ok) {
        showStatus("Could not replace the current resume.");
        return;
      }
      const extra = pendingImport.length - 1;
      showStatus(
        extra > 0
          ? `Current resume replaced. ${extra} other resume${extra === 1 ? "" : "s"} in the file were skipped — use Add as new to import all.`
          : "Current resume replaced."
      );
      return;
    }

    const count = importVersions(pendingImport);
    closeImportDialog();
    showStatus(
      count === 1 ? "Resume imported." : `${count} resumes imported.`
    );
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
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <span className="text-xs text-gray-500 mr-2 max-w-xs text-right">
              {status}
            </span>
          )}
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFileSelected(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={handleBackupJson}
            className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Backup JSON
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={handleSavePdf}
            disabled={!version}
            className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 font-medium"
          >
            Save PDF
          </button>
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

      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeImportDialog}
            aria-label="Close dialog"
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Import JSON</h2>
              <p className="text-sm text-gray-500 mt-1">
                Found {pendingImport.length} resume
                {pendingImport.length === 1 ? "" : "s"} in this file.
                {version ? ` Currently editing “${version.name}”.` : ""}
              </p>
            </div>

            <div className="px-6 py-4 space-y-3">
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === "add"}
                  onChange={() => setImportMode("add")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Add as new
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Keep your current resumes and add imported ones to the
                    sidebar.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  disabled={!version}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Replace current
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Overwrite “{version?.name ?? "current resume"}” with the
                    first resume in the file. Other resumes in the file are not
                    imported.
                  </span>
                </span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeImportDialog}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmImport}
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                {importMode === "replace" ? "Replace resume" : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
