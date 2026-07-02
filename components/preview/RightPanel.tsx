"use client";

import { ResumePreview } from "./ResumePreview";
import { TemplatePicker, TemplateCatalogInfo } from "./TemplatePicker";
import { AiCoachPanel } from "@/components/ai/AiCoachPanel";
import { useUiStore } from "@/lib/ui-store";
import { useResumeStore } from "@/lib/store";

export function RightPanel() {
  const tab = useUiStore((s) => s.rightPanelTab);
  const setTab = useUiStore((s) => s.setRightPanelTab);
  const openCount = useResumeStore((s) => s.getOpenRecommendationCount());

  return (
    <div className="flex flex-col h-full min-w-0 flex-1">
      <div className="no-print flex border-b border-gray-200 bg-white shrink-0">
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "preview"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setTab("coach")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "coach"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          AI Coach
          {openCount > 0 && (
            <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">
              {openCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "preview" ? (
          <div className="print-only-preview h-full overflow-y-auto bg-gray-200 flex flex-col">
            <TemplatePicker />
            <div className="flex-1 overflow-y-auto overflow-x-visible p-6 pt-3">
              <TemplateCatalogInfo />
              <ResumePreview />
            </div>
          </div>
        ) : (
          <AiCoachPanel />
        )}
      </div>
    </div>
  );
}
