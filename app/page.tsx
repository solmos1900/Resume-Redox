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
import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { NewResumeDialog } from "@/components/sidebar/NewResumeDialog";
import { useIsDesktop } from "@/lib/use-media-query";

function AppShell() {
  const isDesktop = useIsDesktop();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapsed();

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <VersionToolbar />

      {isDesktop ? (
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
      ) : (
        <MobileAppShell />
      )}

      <NewResumeDialog />
    </div>
  );
}

export default function Home() {
  return (
    <StoreHydration>
      <AuthProvider>
        <AuthGate>
          <CloudSyncManager />
          <AppShell />
        </AuthGate>
      </AuthProvider>
    </StoreHydration>
  );
}
