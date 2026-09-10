"use client";

import { useUiStore } from "@/lib/ui-store";

/**
 * GF1 chip stub for GF5 — paste JD sheet opens; no silent overwrite / no tailor apply yet.
 */
export function JdPasteSheet() {
  const open = useUiStore((s) => s.jdPasteSheetOpen);
  const close = useUiStore((s) => s.closeJdPasteSheet);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-label="Close job description sheet"
      />
      <div
        role="dialog"
        aria-labelledby="jd-paste-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-xl"
      >
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 id="jd-paste-title" className="text-lg font-bold text-gray-900">
            Paste a job description
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Align a version to a role. Review tailored edits before Apply —
            nothing overwrites until you confirm (GF5).
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">
              Job description
            </span>
            <textarea
              rows={8}
              placeholder="Paste the posting here…"
              className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
          </label>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Tailor review sheet ships in GF5. You can still create from the
            gallery without a JD.
          </p>
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
            disabled
            className="min-h-[44px] rounded-lg bg-gray-300 px-4 text-sm text-gray-600"
            title="Available in GF5"
          >
            Continue (GF5)
          </button>
        </div>
      </div>
    </div>
  );
}
