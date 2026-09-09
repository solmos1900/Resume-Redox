"use client";

import { useState } from "react";
import { PageFitGuide } from "./PageFitGuide";
import { TemplatePicker, TemplateCatalogInfo } from "./TemplatePicker";
import { DesignPanel } from "./DesignPanel";

type Props = {
  /** Hide the desktop "Preview" tab chrome (mobile bottom nav already labels the view). */
  compact?: boolean;
};

type RightTab = "preview" | "design";

export function RightPanel({ compact = false }: Props) {
  const [tab, setTab] = useState<RightTab>("preview");

  return (
    <div className="flex flex-col h-full min-w-0 flex-1">
      {!compact && (
        <div className="no-print flex border-b border-gray-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "preview"
                ? "text-gray-900 border-gray-900"
                : "text-gray-500 border-transparent hover:text-gray-800"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setTab("design")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "design"
                ? "text-gray-900 border-gray-900"
                : "text-gray-500 border-transparent hover:text-gray-800"
            }`}
          >
            Design
          </button>
        </div>
      )}

      {compact && (
        <div className="no-print flex border-b border-gray-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 ${
              tab === "preview"
                ? "text-gray-900 border-gray-900"
                : "text-gray-500 border-transparent"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setTab("design")}
            className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 ${
              tab === "design"
                ? "text-gray-900 border-gray-900"
                : "text-gray-500 border-transparent"
            }`}
          >
            Design
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="print-only-preview h-full overflow-y-auto overscroll-contain bg-gray-200 flex flex-col">
          {tab === "design" ? <DesignPanel /> : <TemplatePicker />}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 pt-3 sm:p-6 sm:pt-3">
            {tab === "preview" && <TemplateCatalogInfo />}
            <PageFitGuide />
          </div>
        </div>
      </div>
    </div>
  );
}
