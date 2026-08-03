"use client";

import { useCallback, useEffect, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";

export function NewResumeDialog() {
  const open = useUiStore((s) => s.newResumeDialogOpen);
  const close = useUiStore((s) => s.closeNewResumeDialog);

  const versions = useResumeStore((s) => s.versions);
  const createBlankWithContext = useResumeStore((s) => s.createBlankWithContext);
  const duplicateFromSource = useResumeStore((s) => s.duplicateFromSource);

  const [startFrom, setStartFrom] = useState<"blank" | "existing">("blank");
  const [sourceId, setSourceId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setStartFrom("blank");
    setSourceId(versions[0]?.id ?? "");
    setName("New Resume");
    setError(null);
  }, [versions]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) return;
    if (startFrom === "existing") {
      const source = versions.find((v) => v.id === sourceId);
      if (source) setName(`${source.name} (Copy)`);
    } else {
      setName("New Resume");
    }
  }, [open, startFrom, sourceId, versions]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a resume name.");
      return;
    }

    if (startFrom === "existing") {
      const effectiveSource = sourceId || versions[0]?.id;
      if (!effectiveSource) {
        setError("Select a source resume.");
        return;
      }
      duplicateFromSource(effectiveSource, trimmedName);
    } else {
      createBlankWithContext(trimmedName);
    }

    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-label="Close dialog"
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">New resume</h2>
          <p className="text-sm text-gray-500 mt-1">
            Start blank or duplicate an existing resume.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-gray-600">
              Start from
            </legend>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={startFrom === "blank"}
                  onChange={() => setStartFrom("blank")}
                />
                Blank resume
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={startFrom === "existing"}
                  onChange={() => setStartFrom("existing")}
                />
                Existing resume
              </label>
            </div>
          </fieldset>

          {startFrom === "existing" && (
            <label className="block">
              <span className="text-xs font-medium text-gray-600">
                Source resume
              </span>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="mt-1 w-full text-sm border rounded-lg px-3 py-2"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-medium text-gray-600">
              Resume name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Manager @ Acme"
              className="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-medium"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Create resume
          </button>
        </div>
      </div>
    </div>
  );
}
