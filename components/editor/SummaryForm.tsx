"use client";

import { useResumeStore } from "@/lib/store";
import { CollapsibleSection } from "./CollapsibleSection";

export function SummaryForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);
  const issueCount = useResumeStore((s) =>
    s.getOpenRecommendationCount("summary")
  );

  if (!version) return null;

  return (
    <CollapsibleSection
      title="Summary"
      sectionId="editor-section-summary"
      issueCount={issueCount}
    >
      <textarea
        value={version.summary}
        onChange={(e) => updateActiveVersion({ summary: e.target.value })}
        rows={6}
        placeholder="Role positioning paragraph — key achievements, skills bridge, target role keywords..."
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </CollapsibleSection>
  );
}
