"use client";

import { EditorPanel } from "@/components/editor/EditorPanel";
import { RightPanel } from "@/components/preview/RightPanel";
import { VersionToolbar } from "@/components/toolbar/VersionToolbar";
import {
  ResumeSidebar,
  useSidebarCollapsed,
} from "@/components/sidebar/ResumeSidebar";
import { StoreHydration } from "@/components/StoreHydration";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { CloudSyncManager } from "@/components/sync/CloudSyncManager";

export default function Home() {
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapsed();

  return (
    <StoreHydration>
      <AuthProvider>
        <AuthGate>
          <CloudSyncManager />
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
        </AuthGate>
      </AuthProvider>
    </StoreHydration>
  );
}
