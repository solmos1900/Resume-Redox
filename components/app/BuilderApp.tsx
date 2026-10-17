"use client";

import { StoreHydration } from "@/components/StoreHydration";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SignInDialog } from "@/components/auth/SignInDialog";
import { CloudSyncManager } from "@/components/sync/CloudSyncManager";
import { LocalStoreScope } from "@/components/sync/LocalStoreScope";
import { ImportResumeDialog } from "@/components/import/ImportResumeDialog";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { TemplateGallery } from "@/components/gallery/TemplateGallery";
import { EditorShell } from "@/components/editor/EditorShell";
import { AppToast } from "@/components/Toast";
import { useUiStore } from "@/lib/ui-store";
import { useEffect } from "react";

/** Deep links from the landing page: /app?start=import | /app?start=new */
function useStartParam() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get("start");
    if (!start) return;
    const ui = useUiStore.getState();
    if (start === "import") {
      ui.openHome();
      ui.openImportResumeDialog(null, "new");
    } else if (start === "new") {
      ui.openGallery();
    }
    window.history.replaceState(null, "", "/app");
  }, []);
}

function Surfaces() {
  useStartParam();
  const appSurface = useUiStore((s) => s.appSurface);
  const importOpen = useUiStore((s) => s.importResumeDialogOpen);
  const importFile = useUiStore((s) => s.importResumeInitialFile);
  const closeImport = useUiStore((s) => s.closeImportResumeDialog);

  return (
    <>
      {appSurface === "home" && <HomeDashboard />}
      {appSurface === "gallery" && <TemplateGallery />}
      {appSurface === "editor" && <EditorShell />}

      <ImportResumeDialog open={importOpen} onClose={closeImport} initialFile={importFile} />
      <SignInDialog />
      <AppToast />
    </>
  );
}

/**
 * The resume builder. No sign-in wall: everything works locally from the
 * first second; an account only adds cross-device sync.
 *
 * LocalStoreScope re-keys the resume persist bucket to the signed-in uid (or
 * guest) before CloudSyncManager runs, so account switches cannot upload the
 * previous user's local resumes (#76).
 */
export function BuilderApp() {
  return (
    <StoreHydration>
      <AuthProvider>
        <LocalStoreScope>
          <CloudSyncManager />
          <Surfaces />
        </LocalStoreScope>
      </AuthProvider>
    </StoreHydration>
  );
}
