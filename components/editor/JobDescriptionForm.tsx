"use client";

import { useResumeStore } from "@/lib/store";
import { CollapsibleSection } from "./CollapsibleSection";

export function JobDescriptionForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;

  const jobText = version.jobDescription?.text ?? "";
  const jobUrl = version.jobDescription?.url ?? "";

  return (
    <CollapsibleSection
      title="Target Role Notes"
      sectionId="editor-section-overall"
      defaultOpen={!!jobText.trim()}
    >
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          Optional notes for this resume — job posting URL and description for
          your reference.
        </p>

        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            Job posting URL
          </span>
          <input
            type="url"
            value={jobUrl}
            onChange={(e) =>
              updateActiveVersion({
                jobDescription: {
                  url: e.target.value,
                  text: jobText,
                },
              })
            }
            placeholder="https://company.com/jobs/..."
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            Job description
          </span>
          <textarea
            value={jobText}
            onChange={(e) =>
              updateActiveVersion({
                jobDescription: {
                  url: jobUrl,
                  text: e.target.value,
                },
              })
            }
            rows={6}
            placeholder="Paste the job description for this target role..."
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
      </div>
    </CollapsibleSection>
  );
}
