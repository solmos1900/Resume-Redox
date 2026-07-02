"use client";

import { useCallback, useEffect, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { suggestResumeName } from "@/lib/suggest-resume-name";
import { useUiStore } from "@/lib/ui-store";

export function NewResumeDialog() {
  const open = useUiStore((s) => s.newResumeDialogOpen);
  const mode = useUiStore((s) => s.newResumeDialogMode);
  const presetSourceId = useUiStore((s) => s.newResumeSourceId);
  const close = useUiStore((s) => s.closeNewResumeDialog);

  const versions = useResumeStore((s) => s.versions);
  const createBlankWithContext = useResumeStore((s) => s.createBlankWithContext);
  const duplicateFromSource = useResumeStore((s) => s.duplicateFromSource);
  const createTailoredFromSource = useResumeStore(
    (s) => s.createTailoredFromSource
  );

  const [startFrom, setStartFrom] = useState<"blank" | "existing">("blank");
  const [sourceId, setSourceId] = useState("");
  const [addContext, setAddContext] = useState(false);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestingName, setSuggestingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceResume = versions.find((v) => v.id === sourceId);
  const isTailorMode = mode === "tailor";

  const resetForm = useCallback(() => {
    setStartFrom(isTailorMode ? "existing" : "blank");
    setSourceId(presetSourceId ?? versions[0]?.id ?? "");
    setAddContext(isTailorMode);
    setName("");
    setNameTouched(false);
    setJobUrl("");
    setJobText("");
    setError(null);
  }, [isTailorMode, presetSourceId, versions]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open || nameTouched) return;
    if (!addContext || !jobText.trim()) {
      if (startFrom === "existing" && sourceResume && !isTailorMode) {
        setName(`${sourceResume.name} (Copy)`);
      } else if (!addContext && startFrom === "blank") {
        setName("New Resume");
      }
      return;
    }

    const timer = setTimeout(async () => {
      setSuggestingName(true);
      try {
        const suggested = await suggestResumeName(
          jobText,
          sourceResume?.name
        );
        if (!nameTouched) setName(suggested);
      } finally {
        setSuggestingName(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    open,
    addContext,
    jobText,
    nameTouched,
    startFrom,
    sourceResume,
    isTailorMode,
  ]);

  const fetchJobUrl = async () => {
    if (!jobUrl.trim()) return;
    setFetchingUrl(true);
    setError(null);
    try {
      const res = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setJobText(data.text ?? "");
      setAddContext(true);
      setNameTouched(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not fetch job posting."
      );
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a resume name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const hasJob = addContext && jobText.trim();
      const effectiveSource = sourceId || versions[0]?.id;

      if (isTailorMode || (startFrom === "existing" && hasJob)) {
        if (!effectiveSource) throw new Error("Select a source resume.");
        if (!jobText.trim()) throw new Error("Add a job description to tailor.");
        await createTailoredFromSource(effectiveSource, jobText.trim(), {
          name: trimmedName,
          jobUrl: jobUrl.trim(),
        });
      } else if (startFrom === "existing" && effectiveSource) {
        duplicateFromSource(effectiveSource, trimmedName);
      } else if (hasJob) {
        createBlankWithContext(trimmedName, jobText.trim(), jobUrl.trim());
      } else {
        createBlankWithContext(trimmedName);
      }

      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
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
          <h2 className="text-lg font-bold text-gray-900">
            {isTailorMode ? "Tailor for a role" : "New resume"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isTailorMode
              ? "Create a new version tailored to a job posting from an existing resume."
              : "Start fresh or build from an existing resume. Add job context to auto-name and tailor."}
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {!isTailorMode && (
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
                    onChange={() => {
                      setStartFrom("existing");
                      setNameTouched(false);
                    }}
                  />
                  Existing resume
                </label>
              </div>
            </fieldset>
          )}

          {(startFrom === "existing" || isTailorMode) && (
            <label className="block">
              <span className="text-xs font-medium text-gray-600">
                Source resume
              </span>
              <select
                value={sourceId}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  setNameTouched(false);
                }}
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

          {!isTailorMode && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addContext}
                onChange={(e) => {
                  setAddContext(e.target.checked);
                  setNameTouched(false);
                }}
              />
              Add target role context (job description)
            </label>
          )}

          {(addContext || isTailorMode) && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3 bg-gray-50">
              <p className="text-xs text-gray-500">
                Paste a job posting to auto-suggest a resume name and tailor
                content when starting from an existing resume.
              </p>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">
                  Job posting URL
                </span>
                <div className="mt-1 flex gap-2">
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-sm border rounded-lg px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={fetchJobUrl}
                    disabled={fetchingUrl || !jobUrl.trim()}
                    className="text-xs px-3 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-40"
                  >
                    {fetchingUrl ? "..." : "Fetch"}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">
                  Job description
                </span>
                <textarea
                  value={jobText}
                  onChange={(e) => {
                    setJobText(e.target.value);
                    setNameTouched(false);
                  }}
                  rows={5}
                  placeholder="Paste the full job description..."
                  className="mt-1 w-full text-sm border rounded-lg px-3 py-2"
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-medium text-gray-600">
              Resume name
              {suggestingName && (
                <span className="text-gray-400 font-normal ml-1">
                  (suggesting...)
                </span>
              )}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              placeholder="e.g. Product Manager @ Acme"
              className="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-medium"
            />
            <p className="text-xs text-gray-400 mt-1">
              Auto-suggested from job context — edit anytime.
            </p>
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
            disabled={submitting}
            className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40"
          >
            {submitting
              ? "Creating..."
              : isTailorMode || (startFrom === "existing" && addContext && jobText.trim())
                ? "Create tailored resume"
                : "Create resume"}
          </button>
        </div>
      </div>
    </div>
  );
}
