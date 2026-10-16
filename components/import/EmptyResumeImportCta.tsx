"use client";

import { useUiStore } from "@/lib/ui-store";
import { useResumeStore } from "@/lib/store";
import { isResumeNonEmpty } from "@/lib/import/resume-content";
import { IconUpload } from "@/components/ui/icons";

/** Shown in the editor while the active resume is still empty. */
export function EmptyResumeImportCta() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const openImport = useUiStore((s) => s.openImportResumeDialog);

  if (!version || isResumeNonEmpty(version)) return null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-200 bg-brand-50/70 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
        <IconUpload size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">Have an old resume?</p>
        <p className="text-[13px] text-ink-muted">Import a PDF or Word file to fill this in.</p>
      </div>
      <button type="button" onClick={() => openImport(null, "auto")} className="btn btn-secondary btn-sm shrink-0">
        Import
      </button>
    </div>
  );
}
