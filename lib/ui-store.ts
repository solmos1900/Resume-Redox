import { create } from "zustand";

export type NewResumeDialogMode = "create";

/** Mobile main-app tabs (lg breakpoint and below). */
export type MobileTab = "resumes" | "edit" | "preview";

type UiStore = {
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
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  newResumeDialogOpen: false,
  newResumeDialogMode: "create",
  newResumeSourceId: null,

  openNewResumeDialog: (mode = "create", sourceId) =>
    set({
      newResumeDialogOpen: true,
      newResumeDialogMode: mode,
      newResumeSourceId: sourceId ?? null,
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

  mobileTab: "edit",
  setMobileTab: (tab) => set({ mobileTab: tab }),
}));
