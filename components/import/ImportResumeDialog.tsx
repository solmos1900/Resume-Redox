"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";
import { useToastStore } from "@/lib/toast-store";
import { buildImportVersion } from "@/lib/import/build-import-version";
import {
  getExtractQuality,
  isResumeNonEmpty,
} from "@/lib/import/resume-content";
import {
  cloneFields,
  contactFillStatus,
  experienceFillStatus,
  fillStatus,
  type FieldFill,
} from "@/lib/import/field-status";
import type { ParsedResumeFields } from "@/lib/import/types";
import type { Experience } from "@/lib/schema";

type ImportMode = "add" | "replace";

type ParseSuccessMeta = {
  format: "pdf" | "docx";
  fileName: string;
  suggestedName: string;
  warnings: string[];
  textPreview?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialFile?: File | null;
};

const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isAllowedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".pdf") ||
    name.endsWith(".docx") ||
    file.type === "application/pdf" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function FillBadge({ status }: { status: FieldFill }) {
  const label =
    status === "filled" ? "Filled" : status === "partial" ? "Partial" : "Empty";
  const cls =
    status === "filled"
      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
      : status === "partial"
        ? "bg-amber-50 text-amber-900 border-amber-100"
        : "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border ${cls}`}
    >
      {label}
    </span>
  );
}

export function ImportResumeDialog({ open, onClose, initialFile }: Props) {
  const importVersions = useResumeStore((s) => s.importVersions);
  const replaceActiveWithImported = useResumeStore(
    (s) => s.replaceActiveWithImported
  );
  const getActiveVersion = useResumeStore((s) => s.getActiveVersion);
  const setMobileTab = useUiStore((s) => s.setMobileTab);
  const showToast = useToastStore((s) => s.showToast);

  const titleId = useId();
  const liveId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  const [meta, setMeta] = useState<ParseSuccessMeta | null>(null);
  const [fields, setFields] = useState<ParsedResumeFields | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("add");
  const [resumeName, setResumeName] = useState("");
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  const active = getActiveVersion();
  const activeIsNonEmpty = isResumeNonEmpty(active);

  const resetParseState = useCallback(() => {
    requestIdRef.current += 1;
    setBusy(false);
    setError(null);
    setUnreadable(false);
    setMeta(null);
    setFields(null);
    setImportMode("add");
    setResumeName("");
    setReplaceConfirmed(false);
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    // Discard parse only — never mutate resume store on cancel.
    resetParseState();
    setLiveMessage("");
    onClose();
  }, [onClose, resetParseState]);

  const parseFile = async (file: File) => {
    if (!isAllowedFile(file)) {
      setError("Only .pdf and .docx files are accepted.");
      setUnreadable(false);
      setMeta(null);
      setFields(null);
      setLiveMessage("Only PDF or DOCX files are accepted.");
      return;
    }

    // Restart parse without touching current resume data.
    const requestId = ++requestIdRef.current;
    setBusy(true);
    setError(null);
    setUnreadable(false);
    setMeta(null);
    setFields(null);
    setReplaceConfirmed(false);
    setLiveMessage("Reading your file…");

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/import-parse", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as
        | {
            ok: true;
            format: "pdf" | "docx";
            fileName: string;
            suggestedName: string;
            warnings: string[];
            fields: ParsedResumeFields;
            textPreview?: string;
            likelyImageOnly?: boolean;
          }
        | { ok: false; error: string; likelyImageOnly?: boolean };

      if (requestId !== requestIdRef.current) return;

      if (!res.ok || !data.ok) {
        const msg = !data.ok
          ? data.error
          : "Could not read text from this file. Try another PDF or DOCX.";
        setError(msg);
        setUnreadable(true);
        setFields(null);
        setMeta(null);
        setLiveMessage(msg);
        return;
      }

      const nextFields = cloneFields(data.fields);
      const quality = getExtractQuality(nextFields);
      if (quality === "empty") {
        const msg =
          "No usable fields were mapped from this file. Try another text-based PDF or DOCX.";
        setError(msg);
        setUnreadable(true);
        setFields(null);
        setMeta({
          format: data.format,
          fileName: data.fileName,
          suggestedName: data.suggestedName,
          warnings: data.warnings,
          textPreview: data.textPreview,
        });
        setLiveMessage(msg);
        return;
      }

      setMeta({
        format: data.format,
        fileName: data.fileName,
        suggestedName: data.suggestedName,
        warnings: data.warnings,
        textPreview: data.textPreview,
      });
      setFields(nextFields);
      setResumeName(data.suggestedName);
      setImportMode("add");
      setLiveMessage(
        quality === "partial"
          ? "Partial extract ready for review."
          : "Mapped fields ready for review."
      );
    } catch {
      if (requestId !== requestIdRef.current) return;
      const msg =
        "Could not reach the import parser. Check your connection and try again.";
      setError(msg);
      setUnreadable(true);
      setLiveMessage(msg);
    } finally {
      if (requestId === requestIdRef.current) setBusy(false);
    }
  };

  // Open / initial file / Esc
  useEffect(() => {
    if (!open) {
      resetParseState();
      return;
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    if (initialFile) void parseFile(initialFile);
    // Focus dialog
    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFile]);

  // Focus trap + Esc
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleClose]);

  const updateContact = (key: keyof ParsedResumeFields["contact"], value: string) => {
    setFields((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        contact: { ...prev.contact, [key]: value },
      };
    });
  };

  const updateJob = (
    index: number,
    patch: Partial<Pick<Experience, "company" | "title" | "location">>
  ) => {
    setFields((prev) => {
      if (!prev) return prev;
      const experience = prev.experience.map((job, i) =>
        i === index ? { ...job, ...patch } : job
      );
      return { ...prev, experience };
    });
  };

  const updateBullets = (index: number, text: string) => {
    const bullets = text
      .split("\n")
      .map((l) => l.replace(/^[-•●▪◦*]\s*/, "").trim())
      .filter(Boolean);
    setFields((prev) => {
      if (!prev) return prev;
      const experience = prev.experience.map((job, i) =>
        i === index ? { ...job, bullets } : job
      );
      return { ...prev, experience };
    });
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void parseFile(file);
  };

  const confirmImport = () => {
    if (!fields || !meta) return;
    const quality = getExtractQuality(fields);
    if (quality === "empty") return;

    if (importMode === "replace" && activeIsNonEmpty && !replaceConfirmed) {
      setError(
        "Confirm Replace this resume, or choose Import into a new version."
      );
      return;
    }

    const version = buildImportVersion(fields, {
      name: resumeName.trim() || meta.suggestedName,
      fileName: meta.fileName,
    });

    const current = getActiveVersion();
    if (!current) {
      setError("No active resume to update.");
      return;
    }

    // Content fill only — preserve template/design/sectionOrder (#15/#18).
    const applyReplace = () =>
      replaceActiveWithImported({
        ...version,
        name: activeIsNonEmpty
          ? current.name
          : resumeName.trim() || current.name || version.name,
        templateId: current.templateId,
        design: current.design,
        sectionOrder: current.sectionOrder,
      });

    if (!activeIsNonEmpty) {
      // Empty resume: fill in place (no second empty shell).
      if (!applyReplace()) {
        setError("Could not update the current resume.");
        return;
      }
    } else if (importMode === "replace") {
      if (!applyReplace()) {
        setError("Could not replace the current resume.");
        return;
      }
    } else {
      importVersions([version]);
    }

    setMobileTab("edit");
    showToast("Imported — review the letter.");
    handleClose();
  };

  if (!open) return null;

  const quality = fields ? getExtractQuality(fields) : null;
  const canApply =
    Boolean(fields) &&
    !busy &&
    !unreadable &&
    (quality === "complete" || quality === "partial") &&
    (importMode !== "replace" || !activeIsNonEmpty || replaceConfirmed);

  const onDialogKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-label="Dismiss import dialog"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={liveId}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto outline-none"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            Import PDF / DOCX
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Read from a file, review mapped fields, then Apply. Nothing is
            written until you Apply. Cancel or Esc discards the extract.
          </p>
        </div>

        <div id={liveId} className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Upload / drop zone — always available to replace file before Apply */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? "border-gray-900 bg-gray-50"
                : "border-gray-300 bg-white"
            }`}
          >
            <p className="text-sm font-medium text-gray-900">
              Drop a PDF or DOCX here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              .pdf / .docx only. Replacing the file restarts the extract without
              changing your current resume.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              id="import-file-input"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void parseFile(file);
              }}
            />
            <label
              htmlFor="import-file-input"
              className="mt-3 inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer touch-manipulation"
            >
              Choose file
            </label>
            {busy && (
              <p className="mt-3 text-sm text-gray-700" role="status">
                Reading your file…
              </p>
            )}
          </div>

          {error && (
            <div
              className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              role="alert"
            >
              <p>{error}</p>
              {unreadable && (
                <button
                  type="button"
                  className="mt-2 min-h-[44px] px-3 text-sm font-medium underline"
                  onClick={() => {
                    setError(null);
                    setUnreadable(false);
                    fileInputRef.current?.click();
                  }}
                >
                  Retry with another file
                </button>
              )}
            </div>
          )}

          {fields && meta && quality && quality !== "empty" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <span className="font-medium text-gray-800">{meta.fileName}</span>
                {" · "}
                {meta.format.toUpperCase()}
                {" · Extract complete"}
              </div>

              {quality === "partial" && (
                <div
                  className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                  role="status"
                >
                  Partial extract — some fields are empty or incomplete. You can
                  edit mapped fields below, then Apply, or Cancel to keep your
                  current resume.
                </div>
              )}

              <label className="block">
                <span className="text-xs font-medium text-gray-600">
                  Version name
                </span>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  className="mt-1 w-full text-sm border rounded-lg px-3 min-h-[44px]"
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Mapped fields
                  </p>
                  <span className="text-[10px] text-gray-400">
                    Inline edit before Apply
                  </span>
                </div>

                <section className="space-y-2 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Contact</h3>
                    <FillBadge status={contactFillStatus(fields.contact)} />
                  </div>
                  <EditableInput
                    label="Name"
                    value={fields.contact.fullName}
                    fill={fillStatus(fields.contact.fullName)}
                    onChange={(v) => updateContact("fullName", v)}
                  />
                  <EditableInput
                    label="Headline"
                    value={fields.contact.headline}
                    fill={fillStatus(fields.contact.headline)}
                    onChange={(v) => updateContact("headline", v)}
                  />
                  <EditableInput
                    label="Email"
                    value={fields.contact.email}
                    fill={fillStatus(fields.contact.email)}
                    onChange={(v) => updateContact("email", v)}
                  />
                  <EditableInput
                    label="Phone"
                    value={fields.contact.phone}
                    fill={fillStatus(fields.contact.phone)}
                    onChange={(v) => updateContact("phone", v)}
                  />
                  <EditableInput
                    label="Location"
                    value={fields.contact.location}
                    fill={fillStatus(fields.contact.location)}
                    onChange={(v) => updateContact("location", v)}
                  />
                  <EditableInput
                    label="LinkedIn"
                    value={fields.contact.linkedIn ?? ""}
                    fill={fillStatus(fields.contact.linkedIn)}
                    onChange={(v) => updateContact("linkedIn", v)}
                  />
                </section>

                <section className="space-y-2 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Summary</h3>
                    <FillBadge status={fillStatus(fields.summary)} />
                  </div>
                  <textarea
                    value={fields.summary}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev ? { ...prev, summary: e.target.value } : prev
                      )
                    }
                    rows={3}
                    className="w-full text-sm border rounded-lg px-3 py-2 min-h-[88px]"
                    placeholder="Empty — add a summary or leave blank"
                  />
                </section>

                <section className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      Experience ({fields.experience.length})
                    </h3>
                    <FillBadge
                      status={experienceFillStatus(fields.experience)}
                    />
                  </div>
                  {fields.experience.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Empty — no roles mapped. You can still Apply and fill this
                      in the editor.
                    </p>
                  ) : (
                    fields.experience.map((job, index) => (
                      <div
                        key={job.id}
                        className="space-y-2 border-t border-gray-100 pt-3 first:border-0 first:pt-0"
                      >
                        <EditableInput
                          label="Company"
                          value={job.company}
                          fill={fillStatus(job.company)}
                          onChange={(v) => updateJob(index, { company: v })}
                        />
                        <EditableInput
                          label="Title"
                          value={job.title}
                          fill={fillStatus(job.title)}
                          onChange={(v) => updateJob(index, { title: v })}
                        />
                        <label className="block">
                          <span className="flex items-center justify-between gap-2 text-xs font-medium text-gray-600">
                            Bullets (one per line)
                            <FillBadge
                              status={
                                job.bullets.some((b) => b.trim())
                                  ? "filled"
                                  : "empty"
                              }
                            />
                          </span>
                          <textarea
                            value={job.bullets.join("\n")}
                            onChange={(e) =>
                              updateBullets(index, e.target.value)
                            }
                            rows={Math.max(2, job.bullets.length || 2)}
                            className="mt-1 w-full text-sm border rounded-lg px-3 py-2 min-h-[88px]"
                          />
                        </label>
                      </div>
                    ))
                  )}
                </section>

                {(fields.education.length > 0 ||
                  fields.skillGroups.length > 0 ||
                  fields.customSections.length > 0) && (
                  <p className="text-xs text-gray-500">
                    Also mapped (editable in the editor after Apply):{" "}
                    {[
                      fields.education.length
                        ? `${fields.education.length} education`
                        : null,
                      fields.skillGroups.length
                        ? `${fields.skillGroups.length} skill group${
                            fields.skillGroups.length === 1 ? "" : "s"
                          }`
                        : null,
                      fields.customSections.length
                        ? `${fields.customSections.length} custom section${
                            fields.customSections.length === 1 ? "" : "s"
                          }`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>

              {meta.warnings.length > 0 && (
                <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 space-y-1">
                  {meta.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}

              {activeIsNonEmpty && (
                <fieldset className="space-y-2">
                  <legend className="text-xs font-medium text-gray-600">
                    How to apply
                  </legend>
                  <p className="text-xs text-gray-500">
                    Your current resume has content. Default is{" "}
                    <span className="font-medium text-gray-700">
                      Import into a new version
                    </span>
                    .
                  </p>
                  <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50 min-h-[44px]">
                    <input
                      type="radio"
                      name="file-import-mode"
                      checked={importMode === "add"}
                      onChange={() => {
                        setImportMode("add");
                        setReplaceConfirmed(false);
                        setError(null);
                      }}
                      className="mt-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        Import into a new version (recommended)
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Keep the current resume and add this as a new sidebar
                        version.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50 min-h-[44px]">
                    <input
                      type="radio"
                      name="file-import-mode"
                      checked={importMode === "replace"}
                      onChange={() => {
                        setImportMode("replace");
                        setReplaceConfirmed(false);
                        setError(null);
                      }}
                      className="mt-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        Replace this resume
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Overwrite this resume&apos;s content only (template and
                        design stay). Requires confirmation.
                      </span>
                    </span>
                  </label>
                  {importMode === "replace" && (
                    <label className="flex items-start gap-3 text-xs text-gray-700 min-h-[44px]">
                      <input
                        type="checkbox"
                        className="mt-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                        checked={replaceConfirmed}
                        onChange={(e) => {
                          setReplaceConfirmed(e.target.checked);
                          setError(null);
                        }}
                      />
                      <span className="pt-2 sm:pt-0">
                        I confirm replacing this resume&apos;s content on Apply.
                      </span>
                    </label>
                  )}
                </fieldset>
              )}

              {!activeIsNonEmpty && (
                <p className="text-xs text-gray-500">
                  Current resume is empty — Apply fills it as a new version (or
                  replaces the empty entry).
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] text-sm px-4 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmImport}
            disabled={!canApply}
            className="min-h-[44px] text-sm px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 font-medium touch-manipulation"
          >
            {importMode === "replace" && activeIsNonEmpty
              ? "Apply replace"
              : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableInput({
  label,
  value,
  fill,
  onChange,
}: {
  label: string;
  value: string;
  fill: FieldFill;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 text-xs font-medium text-gray-600">
        {label}
        <FillBadge status={fill} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full text-sm border rounded-lg px-3 min-h-[44px]"
        placeholder={fill === "empty" ? "Empty" : undefined}
      />
    </label>
  );
}
