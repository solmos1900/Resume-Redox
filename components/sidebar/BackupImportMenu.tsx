"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import type { ResumeVersion } from "@/lib/schema";
import {
  downloadResumeBackup,
  importStoreFromFile,
} from "@/lib/file-persistence";

type ImportMode = "add" | "replace";

function KebabIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
      <circle cx="10" cy="4" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="10" cy="16" r="1.5" />
    </svg>
  );
}

export function BackupImportMenu({ collapsed = false }: { collapsed?: boolean }) {
  const importVersions = useResumeStore((s) => s.importVersions);
  const replaceActiveWithImported = useResumeStore(
    (s) => s.replaceActiveWithImported
  );

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ResumeVersion[] | null>(
    null
  );
  const [importMode, setImportMode] = useState<ImportMode>("add");

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const showStatus = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 4000);
  };

  const handleBackupJson = () => {
    const active = useResumeStore.getState().getActiveVersion();
    setOpen(false);
    if (!active) {
      showStatus("No resume to back up.");
      return;
    }
    downloadResumeBackup(active);
    showStatus(`Backed up "${active.name.trim() || "Untitled Resume"}".`);
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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          collapsed
            ? "p-2 rounded hover:bg-gray-800 text-gray-300"
            : "shrink-0 p-2 rounded-lg border border-gray-600 hover:bg-gray-800 text-gray-300"
        }
        title="Backup or import JSON"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <KebabIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleBackupJson}
            className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50 text-gray-900"
          >
            Backup JSON
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              fileInputRef.current?.click();
            }}
            className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50 text-gray-900"
          >
            Import JSON
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImportFileSelected(file);
          event.target.value = "";
        }}
      />

      {status && (
        <div className="absolute bottom-full left-0 mb-1 w-56 text-xs text-white bg-gray-800 border border-gray-700 rounded-lg shadow-lg px-3 py-2 z-30">
          {status}
        </div>
      )}

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
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Replace current
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Overwrite your currently active resume with the first
                    resume in the file. Other resumes in the file are not
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
    </div>
  );
}
