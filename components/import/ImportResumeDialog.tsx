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
import {
  formatImportMaxFileMb,
  IMPORT_MAX_FILE_BYTES,
} from "@/lib/import/import-limits";
import type { Experience } from "@/lib/schema";
import { SEED_VERSION_ID } from "@/lib/seed-data";
import { useAuth } from "@/components/auth/AuthProvider";
import { IconUpload, IconX } from "@/components/ui/icons";

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
        : "bg-paper-deep text-ink-muted border-line";
  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border ${cls}`}
    >
      {label}
    </span>
  );
}

export function ImportResumeDialog({ open, onClose, initialFile }: Props) {
  const { getServerToken } = useAuth();
  const importVersions = useResumeStore((s) => s.importVersions);
  const replaceActiveWithImported = useResumeStore(
    (s) => s.replaceActiveWithImported
  );
  const getActiveVersion = useResumeStore((s) => s.getActiveVersion);
  const importTarget = useUiStore((s) => s.importTarget);
  const openEditor = useUiStore((s) => s.openEditor);
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
  // From Home / "new resume" flows, or while viewing the sample, an import
  // always becomes its own resume. Only an import started from inside the
  // editor may fill (empty) or replace (confirmed) the open resume.
  const editsActive = importTarget === "auto" && active?.id !== SEED_VERSION_ID;
  const fillInPlace = editsActive && !activeIsNonEmpty;
  const offerReplace = editsActive && activeIsNonEmpty;

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

    if (file.size > IMPORT_MAX_FILE_BYTES) {
      const msg = `File is too large (max ${formatImportMaxFileMb()} MB).`;
      setError(msg);
      setUnreadable(true);
      setMeta(null);
      setFields(null);
      setLiveMessage(msg);
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
      const idToken = await getServerToken();
      if (!idToken) {
        if (requestId !== requestIdRef.current) return;
        const msg =
          "Import needs a brief connection to authorize the upload. Check your network and try again.";
        setError(msg);
        setUnreadable(true);
        setFields(null);
        setMeta(null);
        setLiveMessage(msg);
        return;
      }

      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/import-parse", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
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
        let msg = !data.ok
          ? data.error
          : "Could not read text from this file. Try another PDF or DOCX.";
        if (res.status === 401) {
          msg =
            "Could not authorize import. Refresh the page and try again.";
        } else if (res.status === 413) {
          msg =
            !data.ok && data.error
              ? data.error
              : `File is too large (max ${formatImportMaxFileMb()} MB).`;
        } else if (res.status === 429) {
          msg =
            !data.ok && data.error
              ? data.error
              : "Too many import requests. Wait a moment and try again.";
        } else if (res.status === 503) {
          msg =
            !data.ok && data.error
              ? data.error
              : "Import is temporarily unavailable. Try again shortly.";
        }
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

    if (importMode === "replace" && offerReplace && !replaceConfirmed) {
      setError(
        "Tick “Yes, replace its content”, or choose Save as a new resume."
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
        name: offerReplace
          ? current.name
          : resumeName.trim() || version.name || current.name,
        templateId: current.templateId,
        design: current.design,
        sectionOrder: current.sectionOrder,
      });

    if (fillInPlace) {
      // Empty resume: fill in place (no second empty shell).
      if (!applyReplace()) {
        setError("Could not update the current resume.");
        return;
      }
    } else if (offerReplace && importMode === "replace") {
      if (!applyReplace()) {
        setError("Could not replace the current resume.");
        return;
      }
    } else {
      importVersions([version]);
    }

    openEditor({ tab: "content" });
    showToast("Imported! Give it a quick read — file parsing is never perfect.", 6000);
    handleClose();
  };

  if (!open) return null;

  const quality = fields ? getExtractQuality(fields) : null;
  const canApply =
    Boolean(fields) &&
    !busy &&
    !unreadable &&
    (quality === "complete" || quality === "partial") &&
    (importMode !== "replace" || !offerReplace || replaceConfirmed);

  const onDialogKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]"
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
        className="relative flex max-h-[92dvh] w-full max-w-lg animate-sheet-up flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-pop outline-none sm:rounded-[1.5rem]"
      >
        <div className="flex items-start gap-4 px-6 pb-2 pt-5 sm:pt-6">
          <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-[22px] font-semibold leading-tight tracking-tight text-ink">
            {fields ? "Check what we found" : "Import your resume"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            {fields
              ? "Fix anything that looks off. Nothing is saved until you confirm."
              : "Upload a PDF or Word file. You'll review everything before it's saved."}
          </p>
          </div>
          <button type="button" onClick={handleClose} className="btn-icon -mr-2 -mt-1" aria-label="Close">
            <IconX />
          </button>
        </div>

        <div id={liveId} className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 scrollbar-thin">
          {/* Upload / drop zone — always available to replace file before Apply */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed px-4 text-center transition-colors ${
              fields ? "py-3" : "py-8"
            } ${dragOver ? "border-brand-500 bg-brand-50" : "border-line-strong bg-paper/50"}`}
          >
            {!fields && (
              <>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-card">
                  <IconUpload size={22} />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">Drag your resume here</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  PDF or Word (.docx), up to {formatImportMaxFileMb()} MB
                </p>
              </>
            )}
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
              className={`btn cursor-pointer ${fields ? "btn-ghost btn-sm" : "btn-primary mt-4"}`}
            >
              {fields ? "Use a different file" : "Choose a file"}
            </label>
            {busy && (
              <p className="mt-3 flex items-center justify-center gap-2 text-sm text-ink-soft" role="status">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
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
              <div className="rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink-muted">
                <span className="font-medium text-ink-soft">{meta.fileName}</span>
                {" · "}
                {meta.format.toUpperCase()}
                {" · Read successfully"}
              </div>

              {quality === "partial" && (
                <div
                  className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                  role="status"
                >
                  We could only read part of this file. Fill in the gaps below
                  or after you open it in the editor.
                </div>
              )}

              <label className="block">
                <span className="text-xs font-medium text-ink-muted">
                  Name this resume
                </span>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  className="field mt-1"
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                    What we found
                  </p>
                  <span className="text-[10px] text-ink-faint">
                    Tap any field to fix it
                  </span>
                </div>

                <section className="space-y-2 rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-ink">Contact</h3>
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

                <section className="space-y-2 rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-ink">Summary</h3>
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
                    className="field min-h-[88px]"
                    placeholder="Empty — add a summary or leave blank"
                  />
                </section>

                <section className="space-y-3 rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-ink">
                      Experience ({fields.experience.length})
                    </h3>
                    <FillBadge
                      status={experienceFillStatus(fields.experience)}
                    />
                  </div>
                  {fields.experience.length === 0 ? (
                    <p className="text-xs text-ink-muted">
                      We didn&apos;t find any jobs. You can add them in the editor.
                    </p>
                  ) : (
                    fields.experience.map((job, index) => (
                      <div
                        key={job.id}
                        className="space-y-2 border-t border-line pt-3 first:border-0 first:pt-0"
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
                          <span className="flex items-center justify-between gap-2 text-xs font-medium text-ink-muted">
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
                            className="field mt-1 min-h-[88px]"
                          />
                        </label>
                      </div>
                    ))
                  )}
                </section>

                {(fields.education.length > 0 ||
                  fields.skillGroups.length > 0 ||
                  fields.customSections.length > 0) && (
                  <p className="text-xs text-ink-muted">
                    Also found (edit these in the editor):{" "}
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

              {offerReplace && (
                <fieldset className="space-y-2">
                  <legend className="text-xs font-medium text-ink-muted">
                    How to apply
                  </legend>
                  <p className="text-xs text-ink-muted">
                    The resume you have open already has content.
                  </p>
                  <label className="flex items-start gap-3 rounded-xl border border-line p-3 cursor-pointer hover:bg-paper has-[:checked]:border-ink has-[:checked]:bg-paper min-h-[44px]">
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
                      <span className="block text-sm font-medium text-ink">
                        Save as a new resume (recommended)
                      </span>
                      <span className="block text-xs text-ink-muted mt-0.5">
                        Keep the open resume as it is.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-line p-3 cursor-pointer hover:bg-paper has-[:checked]:border-ink has-[:checked]:bg-paper min-h-[44px]">
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
                      <span className="block text-sm font-medium text-ink">
                        Replace the open resume
                      </span>
                      <span className="block text-xs text-ink-muted mt-0.5">
                        Overwrites its content. Template and design stay.
                      </span>
                    </span>
                  </label>
                  {importMode === "replace" && (
                    <label className="flex items-start gap-3 text-xs text-ink-soft min-h-[44px]">
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
                        Yes, replace its content.
                      </span>
                    </label>
                  )}
                </fieldset>
              )}

              {fillInPlace && (
                <p className="text-xs text-ink-muted">
                  This fills in the empty resume you have open.
                </p>
              )}
              {!editsActive && (
                <p className="text-xs text-ink-muted">
                  This is saved as a new resume. Nothing you already have is changed.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line bg-paper/60 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmImport}
            disabled={!canApply}
            className="btn btn-primary"
          >
            {importMode === "replace" && offerReplace
              ? "Replace & open"
              : "Looks good — open it"}
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
      <span className="flex items-center justify-between gap-2 text-xs font-medium text-ink-muted">
        {label}
        <FillBadge status={fill} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field mt-1"
        placeholder={fill === "empty" ? "Empty" : undefined}
      />
    </label>
  );
}
