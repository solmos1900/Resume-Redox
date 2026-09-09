"use client";

import { useUiStore } from "@/lib/ui-store";
import { useResumeStore } from "@/lib/store";
import { isResumeNonEmpty } from "@/lib/import/resume-content";

/** Shown in the editor when the active resume has no content yet. */
export function EmptyResumeImportCta() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const openImport = useUiStore((s) => s.openImportResumeDialog);

  if (!version || isResumeNonEmpty(version)) return null;

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-5 text-center">
      <p className="text-sm font-medium text-gray-900">Start from a file</p>
      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
        Read from a PDF or DOCX to map fields into this empty resume — you review
        before anything is applied.
      </p>
      <button
        type="button"
        onClick={() => openImport()}
        className="mt-3 inline-flex items-center justify-center min-h-[44px] px-4 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 touch-manipulation"
      >
        Import PDF / DOCX
      </button>
    </div>
  );
}
