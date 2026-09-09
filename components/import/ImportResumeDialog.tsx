"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import type { ResumeVersion } from "@/lib/schema";
import { summarizeParsedFields } from "@/lib/import/build-import-version";
import type { ParsedResumeFields } from "@/lib/import/types";

type ImportMode = "add" | "replace";

type ParseSuccess = {
  format: "pdf" | "docx";
  fileName: string;
  suggestedName: string;
  warnings: string[];
  fields: ParsedResumeFields;
  version: ResumeVersion;
  textPreview?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Optional pre-selected file (e.g. from New resume dialog). */
  initialFile?: File | null;
};

export function ImportResumeDialog({ open, onClose, initialFile }: Props) {
  const importVersions = useResumeStore((s) => s.importVersions);
  const replaceActiveWithImported = useResumeStore(
    (s) => s.replaceActiveWithImported
  );
  const getActiveVersion = useResumeStore((s) => s.getActiveVersion);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseSuccess | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("add");
  const [resumeName, setResumeName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const reset = () => {
    requestIdRef.current += 1;
    setBusy(false);
    setError(null);
    setParsed(null);
    setImportMode("add");
    setResumeName("");
    setStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    // Cancel must leave the active resume unchanged — we only write on confirm.
    reset();
    onClose();
  };

  const parseFile = async (file: File) => {
    const requestId = ++requestIdRef.current;
    setBusy(true);
    setError(null);
    setParsed(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/import-parse", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as
        | (ParseSuccess & { ok: true })
        | { ok: false; error: string };

      if (requestId !== requestIdRef.current) return;

      if (!res.ok || !data.ok) {
        setError(
          !data.ok
            ? data.error
            : "Import failed. Try another PDF or DOCX."
        );
        return;
      }

      setParsed(data);
      setResumeName(data.suggestedName);
      setImportMode("add");
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Network error while parsing. Please try again.");
    } finally {
      if (requestId === requestIdRef.current) setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (initialFile) {
      void parseFile(initialFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open/initialFile drive the dialog lifecycle
  }, [open, initialFile]);

  const confirmImport = () => {
    if (!parsed) return;
    const name = resumeName.trim() || parsed.suggestedName;
    const version: ResumeVersion = {
      ...parsed.version,
      name,
    };

    if (importMode === "replace") {
      const active = getActiveVersion();
      if (!active) {
        setError("No active resume to replace.");
        return;
      }
      // Preserve Phase 1 design controls / template on replace — import is content-only.
      const ok = replaceActiveWithImported({
        ...version,
        name: active.name,
        templateId: active.templateId,
        design: active.design,
        sectionOrder: active.sectionOrder,
      });
      if (!ok) {
        setError("Could not replace the current resume.");
        return;
      }
      setStatus("Current resume updated from import.");
    } else {
      importVersions([version]);
      setStatus("Resume imported as a new version.");
    }

    // Close after short confirmation flash
    setTimeout(() => {
      handleClose();
    }, 400);
  };

  if (!open) return null;

  const stats = parsed ? summarizeParsedFields(parsed.fields) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-label="Close import dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-resume-title"
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2
            id="import-resume-title"
            className="text-lg font-bold text-gray-900"
          >
            Import PDF / DOCX
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review mapped fields, then confirm. Cancel leaves your current
            resume unchanged.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {!parsed && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-900 file:text-white file:text-sm hover:file:bg-gray-800"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void parseFile(file);
                }}
              />
              <p className="text-xs text-gray-500">
                Text-based PDF or DOCX. Image-only PDFs are not supported yet
                (OCR is a later nice-to-have).
              </p>
              {busy && (
                <p className="text-sm text-gray-600" role="status">
                  Parsing resume…
                </p>
              )}
            </div>
          )}

          {error && (
            <div
              className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              role="alert"
            >
              {error}
            </div>
          )}

          {parsed && stats && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <span className="font-medium text-gray-800">
                  {parsed.fileName}
                </span>
                {" · "}
                {parsed.format.toUpperCase()}
                {" · "}
                {stats.experienceCount} experience
                {stats.experienceCount === 1 ? "" : "s"}, {stats.bulletCount}{" "}
                bullet{stats.bulletCount === 1 ? "" : "s"}
              </div>

              <label className="block">
                <span className="text-xs font-medium text-gray-600">
                  Resume name
                </span>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  className="mt-1 w-full text-sm border rounded-lg px-3 py-2"
                />
              </label>

              <div className="space-y-2 text-sm">
                <ReviewRow
                  label="Name"
                  value={parsed.fields.contact.fullName || "—"}
                  empty={!stats.hasName}
                />
                <ReviewRow
                  label="Contact"
                  value={
                    [
                      parsed.fields.contact.email,
                      parsed.fields.contact.phone,
                      parsed.fields.contact.location,
                    ]
                      .filter((s) => s?.trim())
                      .join(" · ") || "—"
                  }
                  empty={!stats.hasContact}
                />
                <ReviewRow
                  label="Headline"
                  value={parsed.fields.contact.headline || "—"}
                />
                <ReviewRow
                  label="Summary"
                  value={
                    parsed.fields.summary
                      ? parsed.fields.summary.slice(0, 160) +
                        (parsed.fields.summary.length > 160 ? "…" : "")
                      : "—"
                  }
                  empty={!parsed.fields.summary.trim()}
                />
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    Experience ({stats.experienceCount})
                  </div>
                  {parsed.fields.experience.length === 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                      None detected — you can still import and edit.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {parsed.fields.experience.map((job) => (
                        <li
                          key={job.id}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                        >
                          <div className="font-medium text-gray-900">
                            {job.title || "Untitled role"}
                            {job.company ? ` · ${job.company}` : ""}
                          </div>
                          <div className="text-gray-500 mt-0.5">
                            {job.bullets.length} bullet
                            {job.bullets.length === 1 ? "" : "s"}
                            {job.bullets[0]
                              ? ` — ${job.bullets[0].slice(0, 80)}${
                                  job.bullets[0].length > 80 ? "…" : ""
                                }`
                              : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {(stats.educationCount > 0 ||
                  stats.skillGroupCount > 0 ||
                  stats.customSectionCount > 0) && (
                  <p className="text-xs text-gray-500">
                    Also mapped:{" "}
                    {[
                      stats.educationCount
                        ? `${stats.educationCount} education`
                        : null,
                      stats.skillGroupCount
                        ? `${stats.skillGroupCount} skill group${
                            stats.skillGroupCount === 1 ? "" : "s"
                          }`
                        : null,
                      stats.customSectionCount
                        ? `${stats.customSectionCount} custom section${
                            stats.customSectionCount === 1 ? "" : "s"
                          }`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>

              {parsed.warnings.length > 0 && (
                <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 space-y-1">
                  {parsed.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}

              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600">
                  How to apply
                </legend>
                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                  <input
                    type="radio"
                    name="file-import-mode"
                    checked={importMode === "add"}
                    onChange={() => setImportMode("add")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Add as new
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      Keep your current resumes and add this one to the
                      sidebar.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                  <input
                    type="radio"
                    name="file-import-mode"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Replace current
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      Overwrite the active resume&apos;s content. Template and
                      design settings stay. This does not run until you
                      confirm.
                    </span>
                  </span>
                </label>
              </fieldset>
            </div>
          )}

          {status && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              {status}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-between gap-2">
          <div>
            {parsed && (
              <button
                type="button"
                onClick={() => {
                  setParsed(null);
                  setError(null);
                  setResumeName("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-sm px-4 py-2.5 text-gray-600 hover:text-gray-900"
              >
                Choose another file
              </button>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="text-sm px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={!parsed || busy}
              className="text-sm px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40"
            >
              {importMode === "replace" ? "Replace resume" : "Import resume"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  empty,
}: {
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div
        className={`text-sm mt-0.5 ${
          empty ? "text-amber-700" : "text-gray-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
