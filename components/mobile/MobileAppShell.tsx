"use client";

import { EditorPanel } from "@/components/editor/EditorPanel";
import { RightPanel } from "@/components/preview/RightPanel";
import { ResumeSidebar } from "@/components/sidebar/ResumeSidebar";
import { useUiStore } from "@/lib/ui-store";
import { MobileTabBar } from "./MobileTabBar";

/**
 * Phone / tablet shell: one panel at a time + bottom tabs.
 * Desktop keeps the three-column layout in page.tsx.
 */
export function MobileAppShell() {
  const mobileTab = useUiStore((s) => s.mobileTab);
  const setMobileTab = useUiStore((s) => s.setMobileTab);

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        {mobileTab === "resumes" && (
          <div className="h-full overflow-hidden">
            <ResumeSidebar
              collapsed={false}
              onToggle={() => setMobileTab("edit")}
              variant="mobile"
              onSelectResume={() => setMobileTab("edit")}
            />
          </div>
        )}

        {mobileTab === "edit" && (
          <aside className="h-full overflow-y-auto overscroll-contain bg-gray-50">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 backdrop-blur px-3 py-2 sm:px-4">
              <p className="text-xs text-gray-500">
                Edit sections below — tap Preview to check page fit and
                templates.
              </p>
            </div>
            <EditorPanel />
          </aside>
        )}

        {mobileTab === "preview" && (
          <div className="h-full min-h-0 overflow-hidden">
            <RightPanel compact />
          </div>
        )}
      </div>

      <MobileTabBar />
    </div>
  );
}
