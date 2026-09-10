import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NewResumeDialogMode = "create";

/** Mobile main-app tabs (lg breakpoint and below). */
export type MobileTab = "resumes" | "edit" | "preview";

/** Gallery-first home vs the three-pane editor (GF1). */
export type AppSurface = "gallery" | "editor";

type UiStore = {
  /** Create wall (gallery) is the front door; editor is last working surface. */
  appSurface: AppSurface;
  openGallery: () => void;
  openEditor: () => void;
  /** True after the user has entered the editor at least once (this browser). */
  hasEnteredEditor: boolean;

  newResumeDialogOpen: boolean;
  newResumeDialogMode: NewResumeDialogMode;
  newResumeSourceId: string | null;
  openNewResumeDialog: (mode?: NewResumeDialogMode, sourceId?: string) => void;
  closeNewResumeDialog: () => void;

  /** Phase 2: PDF/DOCX import review dialog */
  importResumeDialogOpen: boolean;
  importResumeInitialFile: File | null;
  openImportResumeDialog: (file?: File | null) => void;
  closeImportResumeDialog: () => void;

  /** GF1 chip → GF5 stub sheet */
  jdPasteSheetOpen: boolean;
  openJdPasteSheet: () => void;
  closeJdPasteSheet: () => void;

  /** GF1 chip: pick / duplicate an existing version */
  versionPickerOpen: boolean;
  openVersionPicker: () => void;
  closeVersionPicker: () => void;

  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      // Gallery-first: cold users land on the create wall.
      appSurface: "gallery",
      hasEnteredEditor: false,

      openGallery: () => set({ appSurface: "gallery" }),

      openEditor: () =>
        set({
          appSurface: "editor",
          hasEnteredEditor: true,
        }),

      newResumeDialogOpen: false,
      newResumeDialogMode: "create",
      newResumeSourceId: null,

      // + New opens the gallery wall (not the legacy dialog).
      openNewResumeDialog: (_mode = "create", _sourceId) =>
        set({
          appSurface: "gallery",
          newResumeDialogOpen: false,
          newResumeDialogMode: "create",
          newResumeSourceId: null,
        }),

      closeNewResumeDialog: () =>
        set({
          newResumeDialogOpen: false,
          newResumeSourceId: null,
        }),

      importResumeDialogOpen: false,
      importResumeInitialFile: null,

      openImportResumeDialog: (file = null) =>
        set({
          importResumeDialogOpen: true,
          importResumeInitialFile: file ?? null,
        }),

      closeImportResumeDialog: () =>
        set({
          importResumeDialogOpen: false,
          importResumeInitialFile: null,
        }),

      jdPasteSheetOpen: false,
      openJdPasteSheet: () => set({ jdPasteSheetOpen: true }),
      closeJdPasteSheet: () => set({ jdPasteSheetOpen: false }),

      versionPickerOpen: false,
      openVersionPicker: () => set({ versionPickerOpen: true }),
      closeVersionPicker: () => set({ versionPickerOpen: false }),

      mobileTab: "edit",
      setMobileTab: (tab) => set({ mobileTab: tab }),
    }),
    {
      name: "resume-redox-ui",
      skipHydration: true,
      partialize: (state) => ({
        hasEnteredEditor: state.hasEnteredEditor,
        appSurface: state.appSurface,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.hasEnteredEditor) {
          state.appSurface = "gallery";
        }
      },
    }
  )
);
