"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useUiStore } from "@/lib/ui-store";

type Props = {
  title: string;
  sectionId?: string;
  defaultOpen?: boolean;
  issueCount?: number;
  action?: ReactNode;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  sectionId,
  defaultOpen = true,
  issueCount = 0,
  action,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const highlightSection = useUiStore((s) => s.highlightSection);
  const openAiCoachForSection = useUiStore((s) => s.openAiCoachForSection);
  const clearScrollTarget = useUiStore((s) => s.clearScrollTarget);

  const sectionKey = sectionId?.replace("editor-section-", "") as
    | "contact"
    | "summary"
    | "experience"
    | "skills"
    | "education"
    | "overall"
    | undefined;

  useEffect(() => {
    if (highlightSection && sectionKey === highlightSection) {
      setOpen(true);
      clearScrollTarget();
    }
  }, [highlightSection, sectionKey, clearScrollTarget]);

  return (
    <section
      id={sectionId}
      className="border border-gray-200 rounded-lg overflow-hidden scroll-mt-4 transition-shadow"
    >
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-gray-600"
        >
          <span className="text-xs">{open ? "▼" : "▶"}</span>
          {title}
          {issueCount > 0 && sectionKey && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                openAiCoachForSection(sectionKey);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  openAiCoachForSection(sectionKey);
                }
              }}
              className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full cursor-pointer hover:bg-red-200"
              title="View AI feedback"
            >
              {issueCount}
            </span>
          )}
        </button>
        {action}
      </div>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </section>
  );
}
