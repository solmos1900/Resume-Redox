"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import { extractKeywords } from "@/lib/job-description";
import { CollapsibleSection } from "./CollapsibleSection";

export function JobDescriptionForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);
  const adjustCurrentForJob = useResumeStore((s) => s.adjustCurrentForJob);

  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!version) return null;

  const jobText = version.jobDescription?.text ?? "";
  const keywords = jobText.trim() ? extractKeywords(jobText, 12) : [];

  const updateJobText = (text: string) => {
    updateActiveVersion({
      jobDescription: {
        url: version.jobDescription?.url ?? "",
        text,
      },
    });
  };

  const fetchFromUrl = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      updateActiveVersion({
        jobDescription: { url: urlInput.trim(), text: data.text ?? "" },
      });
      setMessage("Job description loaded.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not fetch URL. Paste text instead."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefineInPlace = async () => {
    if (!jobText.trim()) {
      setMessage("Add a job description first.");
      return;
    }
    setRefining(true);
    setMessage(null);
    try {
      await adjustCurrentForJob(jobText);
      setMessage("This resume was refined for the target role.");
    } catch {
      setMessage("Failed to refine resume.");
    } finally {
      setRefining(false);
    }
  };

  return (
    <CollapsibleSection
      title="Target Role Context"
      sectionId="editor-section-overall"
      defaultOpen={!!jobText.trim()}
    >
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          Optional context for this resume — powers AI recommendations and
          in-place refinement. To create a new tailored copy, use{" "}
          <strong>Tailor for role</strong> in the sidebar.
        </p>

        <label className="block">
          <span className="text-xs font-medium text-gray-600">Job posting URL</span>
          <div className="mt-1 flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://company.com/jobs/..."
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={fetchFromUrl}
              disabled={loading || !urlInput.trim()}
              className="shrink-0 px-3 py-2 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40"
            >
              {loading ? "Fetching..." : "Fetch"}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            Job description
          </span>
          <textarea
            value={jobText}
            onChange={(e) => updateJobText(e.target.value)}
            rows={6}
            placeholder="Paste the job description for this target role..."
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        {keywords.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-600">
              Detected keywords
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {jobText.trim() && (
          <button
            type="button"
            onClick={handleRefineInPlace}
            disabled={refining}
            className="text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            {refining ? "Refining..." : "Refine this resume in place"}
          </button>
        )}

        {message && (
          <p className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1.5">
            {message}
          </p>
        )}
      </div>
    </CollapsibleSection>
  );
}
