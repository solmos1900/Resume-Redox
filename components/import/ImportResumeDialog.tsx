"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import type { ResumeVersion } from "@/lib/schema";
import { summarizeParsedFields } from "@/lib/import/build-import-version";
import {
  getExtractQuality,
  isResumeNonEmpty,
} from "@/lib/import/resume-content";
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
  /** Explicit confirmation when user picks Replace on a non-empty resume. */
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);

  const active = getActiveVersion();
  const activeIsNonEmpty = isResumeNonEmpty(active);

  const defaultMode = (): ImportMode => {
    // Amadeus: prefer new version when current resume has content.
    // Replace is never the default overwrite path.
    return "add";
  };

  const reset = () => {
    requestIdRef.current += 1;
    setBusy(false);
    setError(null);
    setParsed(null);
    setImportMode(defaultMode());
    setResumeName("");
    setStatus(null);
    setReplaceConfirmed(false);
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
    setReplaceConfirmed(false);
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
            : "Could not extract text from this file. Try a text-based PDF or DOCX."
        );
        return;
      }

      setParsed(data);
      setResumeName(data.suggestedName);
      setImportMode(defaultMode());
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Could not reach the import parser. Check your connection and try again.");
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

    if (importMode === "replace" && activeIsNonEmpty && !replaceConfirmed) {
      setError(
        "Replace overwrites the active resume's content. Check the confirmation box to continue, or choose New version instead."
      );
      return;
    }

    const name = resumeName.trim() || parsed.suggestedName;
    const version: ResumeVersion = {
      ...parsed.version,
      name,
    };

    if (importMode === "replace") {
      const current = getActiveVersion();
      if (!current) {
        setError("No active resume to replace.");
        return;
      }
      // Preserve Phase 1 design controls / template on replace — import is content-only.
      const ok = replaceActiveWithImported({
        ...version,
        name: current.name,
        templateId: current.templateId,
        design: current.design,
        sectionOrder: current.sectionOrder,
      });
      if (!ok) {
        setError("Could not replace the current resume.");
        return;
      }
      setStatus("Active resume content replaced from import.");
    } else {
      importVersions([version]);
      setStatus("Imported as a new version.");
    }

    setTimeout(() => {
      handleClose();
    }, 400);
  };

  if (!open) return null;

  const stats = parsed ? summarizeParsedFields(parsed.fields) : null;
  const quality = parsed ? getExtractQuality(parsed.fields) : null;
  const canApply =
    Boolean(parsed) &&
    !busy &&
    quality !== "empty" &&
    (importMode !== "replace" ||
      !activeIsNonEmpty ||
      replaceConfirmed);

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
            We extract selectable text and map it into resume fields. Review the
            mapping, then Apply or Cancel — nothing is written until you apply.
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
                Accepts text-based PDF or DOCX. Scanned/image-only PDFs have no
                text layer to extract — those are out of scope for this release.
              </p>
              {busy && (
                <p className="text-sm text-gray-600" role="status">
                  Extracting text and mapping fields…
                </p>
              )}
              {!busy && !error && (
                <p className="text-xs text-gray-400">
                  Empty state: choose a file to begin. Cancel anytime — your
                  current resume stays as-is.
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

          {parsed && stats && quality && (
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

              {quality === "empty" && (
                <div
                  className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                  role="status"
                >
                  No usable fields were mapped from this file. Try another
                  text-based PDF or DOCX, or Cancel to keep your current resume.
                </div>
              )}

              {quality === "partial" && (
                <div
                  className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                  role="status"
                >
                  Partial extract — some sections are missing or incomplete.
                  Review the mapped fields below before applying; you can edit
                  anything after import.
                </div>
              )}

              {quality !== "empty" && (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">
                      Version name
                    </span>
                    <input
                      type="text"
                      value={resumeName}
                      onChange={(e) => setResumeName(e.target.value)}
                      className="mt-1 w-full text-sm border rounded-lg px-3 py-2"
                    />
                  </label>

                  <div className="space-y-2 text-sm">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Mapped fields
                    </p>
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
                      empty={!parsed.fields.contact.headline?.trim()}
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
                          None mapped — you can still create a version and fill
                          this in manually.
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
                    {activeIsNonEmpty && (
                      <p className="text-xs text-gray-500">
                        Your current resume has content — default is{" "}
                        <span className="font-medium text-gray-700">
                          New version
                        </span>{" "}
                        so nothing is overwritten unless you choose Replace.
                      </p>
                    )}
                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                      <input
                        type="radio"
                        name="file-import-mode"
                        checked={importMode === "add"}
                        onChange={() => {
                          setImportMode("add");
                          setReplaceConfirmed(false);
                          setError(null);
                        }}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">
                          New version
                          {activeIsNonEmpty ? " (recommended)" : ""}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Keep your current resume and add this as a new sidebar
                          version.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                      <input
                        type="radio"
                        name="file-import-mode"
                        checked={importMode === "replace"}
                        onChange={() => {
                          setImportMode("replace");
                          setReplaceConfirmed(false);
                          setError(null);
                        }}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">
                          Replace current
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Overwrite the active resume&apos;s content. Template
                          and design settings stay. Requires an explicit
                          confirmation below.
                        </span>
                      </span>
                    </label>
                    {importMode === "replace" && activeIsNonEmpty && (
                      <label className="flex items-start gap-2 text-xs text-gray-700 pl-1">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={replaceConfirmed}
                          onChange={(e) => {
                            setReplaceConfirmed(e.target.checked);
                            setError(null);
                          }}
                        />
                        <span>
                          I understand this replaces the active resume&apos;s
                          content (not a silent overwrite — only after Apply).
                        </span>
                      </label>
                    )}
                  </fieldset>
                </>
              )}
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
                  setReplaceConfirmed(false);
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
              disabled={!canApply}
              className="text-sm px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40"
            >
              {importMode === "replace" ? "Apply replace" : "Apply as new version"}
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
