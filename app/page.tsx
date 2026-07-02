"use client";

import { EditorPanel } from "@/components/editor/EditorPanel";
import { RightPanel } from "@/components/preview/RightPanel";
import { VersionToolbar } from "@/components/toolbar/VersionToolbar";
import {
  ResumeSidebar,
  useSidebarCollapsed,
} from "@/components/sidebar/ResumeSidebar";
import { StoreHydration } from "@/components/StoreHydration";

export default function Home() {
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapsed();

  return (
    <StoreHydration>
      <div className="h-screen flex flex-col overflow-hidden">
        <VersionToolbar />
        <div className="flex flex-1 overflow-hidden">
          <ResumeSidebar
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
          <aside className="no-print w-[38%] min-w-[300px] max-w-[480px] border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <EditorPanel />
          </aside>
          <RightPanel />
        </div>
      </div>
    </StoreHydration>
  );
}
