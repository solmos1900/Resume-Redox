import { create } from "zustand";

export type NewResumeDialogMode = "create";

type UiStore = {
  newResumeDialogOpen: boolean;
  newResumeDialogMode: NewResumeDialogMode;
  newResumeSourceId: string | null;
  openNewResumeDialog: (mode?: NewResumeDialogMode, sourceId?: string) => void;
  closeNewResumeDialog: () => void;
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
}));
