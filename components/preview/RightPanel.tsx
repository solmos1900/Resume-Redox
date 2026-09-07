"use client";

import { PageFitGuide } from "./PageFitGuide";
import { TemplatePicker, TemplateCatalogInfo } from "./TemplatePicker";

type Props = {
  /** Hide the desktop "Preview" tab chrome (mobile bottom nav already labels the view). */
  compact?: boolean;
};

export function RightPanel({ compact = false }: Props) {
  return (
    <div className="flex flex-col h-full min-w-0 flex-1">
      {!compact && (
        <div className="no-print flex border-b border-gray-200 bg-white shrink-0">
          <div className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-900 border-b-2 border-gray-900">
            Preview
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="print-only-preview h-full overflow-y-auto overscroll-contain bg-gray-200 flex flex-col">
          <TemplatePicker />
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 pt-3 sm:p-6 sm:pt-3">
            <TemplateCatalogInfo />
            <PageFitGuide />
          </div>
        </div>
      </div>
    </div>
  );
}
