import { create } from "zustand";
import type { AiRecommendationSection, AiRecommendationType } from "@/lib/schema";

export type RightPanelTab = "preview" | "coach";

export type NewResumeDialogMode = "create" | "tailor";

type UiStore = {
  rightPanelTab: RightPanelTab;
  aiTypeFilter: AiRecommendationType | "all";
  aiSectionFilter: AiRecommendationSection | "all";
  highlightSection: AiRecommendationSection | null;
  scrollToRecommendationId: string | null;
  newResumeDialogOpen: boolean;
  newResumeDialogMode: NewResumeDialogMode;
  newResumeSourceId: string | null;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setAiTypeFilter: (type: AiRecommendationType | "all") => void;
  setAiSectionFilter: (section: AiRecommendationSection | "all") => void;
  openAiCoachForSection: (section: AiRecommendationSection) => void;
  scrollToRecommendation: (id: string) => void;
  clearScrollTarget: () => void;
  openNewResumeDialog: (mode?: NewResumeDialogMode, sourceId?: string) => void;
  closeNewResumeDialog: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  rightPanelTab: "preview",
  aiTypeFilter: "all",
  aiSectionFilter: "all",
  highlightSection: null,
  scrollToRecommendationId: null,
  newResumeDialogOpen: false,
  newResumeDialogMode: "create",
  newResumeSourceId: null,

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  setAiTypeFilter: (type) => set({ aiTypeFilter: type }),

  setAiSectionFilter: (section) => set({ aiSectionFilter: section }),

  openAiCoachForSection: (section) =>
    set({
      rightPanelTab: "coach",
      aiSectionFilter: section,
      highlightSection: section,
    }),

  scrollToRecommendation: (id) =>
    set({
      rightPanelTab: "coach",
      scrollToRecommendationId: id,
    }),

  clearScrollTarget: () =>
    set({ scrollToRecommendationId: null, highlightSection: null }),

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

export const SECTION_DOM_IDS: Record<AiRecommendationSection, string> = {
  contact: "editor-section-contact",
  summary: "editor-section-summary",
  experience: "editor-section-experience",
  skills: "editor-section-skills",
  education: "editor-section-education",
  overall: "editor-section-overall",
};

export function jumpToEditorSection(section: AiRecommendationSection) {
  const id = SECTION_DOM_IDS[section];
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("ring-2", "ring-blue-400");
    setTimeout(() => el.classList.remove("ring-2", "ring-blue-400"), 2000);
  }
}
