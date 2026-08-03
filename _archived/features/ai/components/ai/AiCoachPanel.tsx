"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import { runRecommend, runRoast, runSpellCheck } from "@/lib/ai/run-analysis";
import { useUiStore } from "@/lib/ui-store";
import type { AiRecommendation } from "@/lib/schema";
import { AiCoachFilters } from "./AiCoachFilters";
import { AiRecommendationCard } from "./AiRecommendationCard";

export function AiCoachPanel() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const setAiRecommendations = useResumeStore((s) => s.setAiRecommendations);
  const applyAllSpellRecommendations = useResumeStore(
    (s) => s.applyAllSpellRecommendations
  );

  const typeFilter = useUiStore((s) => s.aiTypeFilter);
  const sectionFilter = useUiStore((s) => s.aiSectionFilter);
  const scrollToRecommendationId = useUiStore(
    (s) => s.scrollToRecommendationId
  );
  const setAiTypeFilter = useUiStore((s) => s.setAiTypeFilter);
  const setAiSectionFilter = useUiStore((s) => s.setAiSectionFilter);
  const clearScrollTarget = useUiStore((s) => s.clearScrollTarget);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  if (!version) {
    return (
      <div className="p-6 text-sm text-gray-500">Select a resume to use AI Coach.</div>
    );
  }

  const openRecs = version.aiRecommendations.filter((r) => r.status === "open");
  const filtered = openRecs.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (sectionFilter !== "all" && r.section !== sectionFilter) return false;
    return true;
  });

  const runAnalysis = async (
    key: string,
    fn: () => Promise<{
      recommendations: AiRecommendation[];
      summary?: string;
      score?: number;
    }>,
    recType: "roast" | "spell" | "general",
    metaKey: "lastRoastAt" | "lastSpellCheckAt" | "lastRecommendAt"
  ) => {
    setLoading(key);
    setError(null);
    setSummary(null);
    setScore(null);
    try {
      const result = await fn();
      setAiRecommendations(recType, result.recommendations, metaKey);
      if (result.summary) setSummary(result.summary);
      if (result.score !== undefined) setScore(result.score);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(null);
    }
  };

  const spellOpenCount = openRecs.filter((r) => r.type === "spell").length;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-gray-200 space-y-2">
        <h2 className="text-sm font-bold text-gray-900">AI Coach</h2>
        <p className="text-xs text-gray-500">
          Analyze and improve this resume. To tailor for a new role, use{" "}
          <strong>Tailor for role</strong> in the sidebar.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!loading}
            onClick={() =>
              runAnalysis("roast", () => runRoast(version), "roast", "lastRoastAt")
            }
            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-40"
          >
            {loading === "roast" ? "Roasting..." : "Roast Resume"}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() =>
              runAnalysis(
                "spell",
                () => runSpellCheck(version),
                "spell",
                "lastSpellCheckAt"
              )
            }
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            {loading === "spell" ? "Checking..." : "Spell Check"}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() =>
              runAnalysis(
                "recommend",
                () => runRecommend(version),
                "general",
                "lastRecommendAt"
              )
            }
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            {loading === "recommend" ? "Analyzing..." : "Recommendations"}
          </button>
        </div>

        {spellOpenCount > 0 && (
          <button
            type="button"
            onClick={applyAllSpellRecommendations}
            className="text-xs px-3 py-1.5 bg-green-700 text-white rounded hover:bg-green-800"
          >
            Apply all spelling fixes ({spellOpenCount})
          </button>
        )}
      </div>

      <AiCoachFilters
        typeFilter={typeFilter}
        sectionFilter={sectionFilter}
        onTypeChange={setAiTypeFilter}
        onSectionChange={setAiSectionFilter}
      />

      {(summary || score !== null) && (
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 text-sm">
          {score !== null && (
            <p className="font-semibold text-gray-900">Score: {score}/10</p>
          )}
          {summary && <p className="text-gray-700 mt-0.5">{summary}</p>}
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            {openRecs.length === 0
              ? "Run an analysis above to get AI feedback."
              : "No open recommendations match your filters."}
          </p>
        ) : (
          filtered.map((rec) => (
            <AiRecommendationCard
              key={rec.id}
              recommendation={rec}
              scrollTarget={scrollToRecommendationId === rec.id}
              onScrolled={clearScrollTarget}
            />
          ))
        )}
      </div>
    </div>
  );
}
