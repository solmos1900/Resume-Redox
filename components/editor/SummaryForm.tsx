"use client";

import { useResumeStore } from "@/lib/store";
import { CollapsibleSection } from "./CollapsibleSection";
import { AutoTextarea } from "./fields";

export function SummaryForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;
  const words = version.summary.trim() ? version.summary.trim().split(/\s+/).length : 0;

  return (
    <CollapsibleSection
      title="Summary"
      description="2–3 sentences: who you are, your strongest proof, and the role you want."
      sectionId="editor-section-summary"
      complete={words > 0}
    >
      <AutoTextarea
        aria-label="Summary"
        value={version.summary}
        onChange={(e) => updateActiveVersion({ summary: e.target.value })}
        minRows={4}
        placeholder="Product manager with 6 years shipping B2B payments tools. Grew activation 32% at Acme by… Looking to lead platform products."
      />
      <p className={`text-right text-[11px] ${words > 80 ? "text-brand-700" : "text-ink-faint"}`}>
        {words} words{words > 80 ? " · recruiters skim — aim for under 80" : ""}
      </p>
    </CollapsibleSection>
  );
}
