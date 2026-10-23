"use client";

import { useUiStore } from "@/lib/ui-store";
import { IconSparkle } from "@/components/ui/icons";
import { ProBadge } from "./ProBadge";

/** Top of the Content tab: one-tap AI proofreading (Pro). */
export function AiReviewBar() {
  const openUpgrade = useUiStore((s) => s.openUpgrade);
  return (
    <button
      type="button"
      onClick={() => openUpgrade("spellcheck")}
      className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <IconSparkle size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          Check spelling &amp; grammar <ProBadge />
        </span>
        <span className="block truncate text-[13px] text-ink-muted">
          Catch typos, tense slips, and inconsistent dates in one pass.
        </span>
      </span>
      <span className="hidden text-[13px] font-semibold text-brand-700 group-hover:underline sm:inline">Run check</span>
    </button>
  );
}
