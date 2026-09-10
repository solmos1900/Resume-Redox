"use client";

import { useEffect, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";

/**
 * GF1 chip: Use an existing version — open in editor or duplicate as a new version.
 */
export function VersionPickerSheet() {
  const open = useUiStore((s) => s.versionPickerOpen);
  const close = useUiStore((s) => s.closeVersionPicker);
  const openEditor = useUiStore((s) => s.openEditor);

  const versions = useResumeStore((s) => s.versions);
  const setActiveVersion = useResumeStore((s) => s.setActiveVersion);
  const duplicateFromSource = useResumeStore((s) => s.duplicateFromSource);

  const sorted = [...versions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<"open" | "duplicate">("open");

  useEffect(() => {
    if (!open) return;
    const firstId = [...versions].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0]?.id;
    setSelectedId(firstId ?? "");
    setMode("open");
  }, [open, versions]);

  if (!open) return null;

  const effectiveId = selectedId || sorted[0]?.id || "";

  const handleConfirm = () => {
    if (!effectiveId) return;
    if (mode === "duplicate") {
      const source = versions.find((v) => v.id === effectiveId);
      duplicateFromSource(
        effectiveId,
        source ? `${source.name} (Copy)` : "Resume copy"
      );
    } else {
      setActiveVersion(effectiveId);
    }
    close();
    openEditor();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-label="Close version picker"
      />
      <div
        role="dialog"
        aria-labelledby="version-picker-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-xl"
      >
        <div className="border-b border-gray-200 px-5 py-4">
          <h2
            id="version-picker-title"
            className="text-lg font-bold text-gray-900"
          >
            Use an existing version
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Open a resume in the editor, or duplicate it as a new version.
          </p>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-600">
              No versions yet — create Blank or pick a template on the wall.
            </p>
          ) : (
            <>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">
                  Version
                </span>
                <select
                  value={effectiveId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                >
                  {sorted.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600">
                  Action
                </legend>
                <label className="flex min-h-[44px] items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={mode === "open"}
                    onChange={() => setMode("open")}
                  />
                  Open in editor
                </label>
                <label className="flex min-h-[44px] items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={mode === "duplicate"}
                    onChange={() => setMode("duplicate")}
                  />
                  Duplicate as new version
                </label>
              </fieldset>
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!effectiveId}
            className="min-h-[44px] rounded-lg bg-gray-900 px-4 text-sm text-white hover:bg-gray-800 disabled:opacity-40"
          >
            {mode === "duplicate" ? "Duplicate & edit" : "Open editor"}
          </button>
        </div>
      </div>
    </div>
  );
}
