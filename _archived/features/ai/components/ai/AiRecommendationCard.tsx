"use client";

import { useEffect, useRef } from "react";
import type { AiRecommendation } from "@/lib/schema";
import { jumpToEditorSection } from "@/lib/ui-store";
import { useResumeStore } from "@/lib/store";

const SEVERITY_STYLES = {
  critical: "border-red-300 bg-red-50",
  warning: "border-amber-300 bg-amber-50",
  suggestion: "border-blue-200 bg-blue-50",
  praise: "border-green-200 bg-green-50",
};

const TYPE_LABELS = {
  roast: "Roast",
  spell: "Spelling",
  tailor: "Tailor",
  general: "Tip",
};

type Props = {
  recommendation: AiRecommendation;
  scrollTarget?: boolean;
  onScrolled?: () => void;
};

export function AiRecommendationCard({
  recommendation: rec,
  scrollTarget,
  onScrolled,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const applyRecommendation = useResumeStore((s) => s.applyRecommendation);
  const dismissRecommendation = useResumeStore((s) => s.dismissRecommendation);

  useEffect(() => {
    if (scrollTarget && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      onScrolled?.();
    }
  }, [scrollTarget, onScrolled]);

  if (rec.status === "dismissed") return null;

  const canApply = rec.status === "open" && !!rec.suggestedText;

  return (
    <div
      ref={ref}
      id={`ai-rec-${rec.id}`}
      className={`border rounded-lg p-3 ${SEVERITY_STYLES[rec.severity]} ${
        rec.status === "applied" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex flex-wrap gap-1">
          <span className="text-xs font-medium px-1.5 py-0.5 bg-white/80 rounded border border-gray-200">
            {TYPE_LABELS[rec.type]}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {rec.section}
            {rec.fieldPath ? ` · ${rec.fieldPath}` : ""}
          </span>
        </div>
        {rec.status === "applied" && (
          <span className="text-xs text-green-700 font-medium">Applied</span>
        )}
      </div>

      <h4 className="text-sm font-semibold text-gray-900">{rec.title}</h4>
      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{rec.message}</p>

      {rec.suggestedText && (
        <div className="mt-2 text-xs bg-white/70 rounded p-2 border border-gray-200">
          <span className="font-medium text-gray-600">Suggested: </span>
          {rec.suggestedText}
        </div>
      )}

      {rec.status === "open" && (
        <div className="flex flex-wrap gap-2 mt-3">
          {canApply && (
            <button
              type="button"
              onClick={() => applyRecommendation(rec.id)}
              className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Apply Fix
            </button>
          )}
          {rec.section !== "overall" && (
            <button
              type="button"
              onClick={() => jumpToEditorSection(rec.section)}
              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-white"
            >
              Jump to Field
            </button>
          )}
          <button
            type="button"
            onClick={() => dismissRecommendation(rec.id)}
            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
