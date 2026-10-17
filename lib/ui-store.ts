import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Top-level surfaces of the builder (/app):
 * - home:    "My resumes" dashboard + first-run welcome
 * - gallery: pick a template for a NEW resume
 * - editor:  edit one resume with live preview
 */
export type AppSurface = "home" | "gallery" | "editor";

/** Left-pane tabs in the editor. */
export type EditorTab = "content" | "design" | "job";

/** Phone/tablet: one pane at a time. */
export type MobileTab = "edit" | "preview";

/**
 * Where a PDF/DOCX import lands:
 * - new:  always a brand-new resume (from Home / gallery)
 * - auto: fill the active resume if it's empty, otherwise ask (from the editor)
 */
export type ImportTarget = "new" | "auto";

type UiStore = {
  appSurface: AppSurface;
  openHome: () => void;
  openGallery: () => void;
  openEditor: (opts?: { tab?: EditorTab; preview?: boolean }) => void;
  /** True after the user has opened the editor at least once (this browser). */
  hasEnteredEditor: boolean;

  editorTab: EditorTab;
  setEditorTab: (tab: EditorTab) => void;

  importResumeDialogOpen: boolean;
  importResumeInitialFile: File | null;
  importTarget: ImportTarget;
  openImportResumeDialog: (file?: File | null, target?: ImportTarget) => void;
  closeImportResumeDialog: () => void;

  signInOpen: boolean;
  /** Optional reason shown at the top of the sign-in dialog. */
  signInReason: string | null;
  openSignIn: (reason?: string) => void;
  closeSignIn: () => void;

  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      appSurface: "home",
      hasEnteredEditor: false,

      openHome: () => set({ appSurface: "home" }),
      openGallery: () => set({ appSurface: "gallery" }),
      openEditor: (opts) =>
        set((state) => ({
          appSurface: "editor",
          hasEnteredEditor: true,
          editorTab: opts?.tab ?? state.editorTab,
          mobileTab: opts?.preview ? "preview" : "edit",
        })),

      editorTab: "content",
      setEditorTab: (tab) => set({ editorTab: tab }),

      importResumeDialogOpen: false,
      importResumeInitialFile: null,
      importTarget: "auto",
      openImportResumeDialog: (file = null, target = "auto") =>
        set({
          importResumeDialogOpen: true,
          importResumeInitialFile: file ?? null,
          importTarget: target,
        }),
      closeImportResumeDialog: () =>
        set({
          importResumeDialogOpen: false,
          importResumeInitialFile: null,
        }),

      signInOpen: false,
      signInReason: null,
      openSignIn: (reason) => set({ signInOpen: true, signInReason: reason ?? null }),
      closeSignIn: () => set({ signInOpen: false, signInReason: null }),

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
        // Returning users resume where they left off; the gallery is never a
        // place to land cold (older builds persisted "gallery" as the home).
        if (state.appSurface !== "editor" || !state.hasEnteredEditor) {
          state.appSurface = "home";
        }
        state.editorTab = "content";
        state.mobileTab = "edit";
      },
    }
  )
);
