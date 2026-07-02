import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyRecommendationToVersion,
  applyAllSpellFixes,
} from "./apply-recommendation";
import { mergeRecommendationsByType } from "./ai/parse";
import {
  createEmptyVersion,
  resumeVersionSchema,
  storeSchema,
  type AiRecommendation,
  type AiRecommendationSection,
  type AiRecommendationType,
  type ResumeVersion,
} from "./schema";
import {
  extractJobTitle,
  tailorResumeLocally,
} from "./job-description";
import { createInitialStore } from "./seed-data";

type ResumeStore = {
  activeVersionId: string;
  versions: ResumeVersion[];
  getActiveVersion: () => ResumeVersion | undefined;
  getVersionById: (id: string) => ResumeVersion | undefined;
  setActiveVersion: (id: string) => void;
  updateActiveVersion: (updates: Partial<ResumeVersion>) => void;
  updateVersion: (id: string, updates: Partial<ResumeVersion>) => void;
  createVersion: (name?: string) => void;
  duplicateVersion: (name?: string) => ResumeVersion | undefined;
  duplicateFromSource: (sourceVersionId: string, name: string) => void;
  createBlankWithContext: (
    name: string,
    jobText?: string,
    jobUrl?: string
  ) => void;
  renameVersion: (id: string, name: string) => void;
  deleteVersion: (id: string) => void;
  setAiRecommendations: (
    type: AiRecommendationType,
    recommendations: AiRecommendation[],
    metaKey?: keyof NonNullable<ResumeVersion["aiMeta"]>
  ) => void;
  applyRecommendation: (id: string) => boolean;
  applyAllSpellRecommendations: () => void;
  dismissRecommendation: (id: string) => void;
  getOpenRecommendationCount: (section?: AiRecommendationSection) => number;
  createTailoredFromSource: (
    sourceVersionId: string,
    jobText: string,
    options?: { name?: string; jobUrl?: string }
  ) => Promise<void>;
  adjustCurrentForJob: (jobText: string, sourceVersionId?: string) => Promise<void>;
};

function cloneVersion(version: ResumeVersion, newName: string): ResumeVersion {
  const json = JSON.stringify(version);
  const clone = JSON.parse(json) as ResumeVersion;
  clone.id = crypto.randomUUID();
  clone.name = newName;
  clone.updatedAt = new Date().toISOString();
  clone.templateId = version.templateId ?? "classic";
  clone.aiRecommendations = [];
  clone.aiMeta = {};
  clone.experience = clone.experience.map((e) => ({
    ...e,
    id: crypto.randomUUID(),
  }));
  clone.skillGroups = clone.skillGroups.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
  }));
  clone.education = clone.education.map((e) => ({
    ...e,
    id: crypto.randomUUID(),
  }));
  return clone;
}

function withAiDefaults(v: Partial<ResumeVersion>): ResumeVersion {
  return {
    ...v,
    templateId: v.templateId ?? "classic",
    jobDescription: v.jobDescription ?? { url: "", text: "" },
    aiRecommendations: v.aiRecommendations ?? [],
    aiMeta: v.aiMeta ?? {},
  } as ResumeVersion;
}

async function fetchTailorAi(
  resume: ResumeVersion,
  jobDescription: string,
  mode: "create" | "adjust"
) {
  const res = await fetch("/api/ai/tailor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, jobDescription, mode }),
  });
  if (!res.ok) return null;
  return res.json();
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      ...createInitialStore(),

      getActiveVersion: () => {
        const { activeVersionId, versions } = get();
        return versions.find((v) => v.id === activeVersionId);
      },

      getVersionById: (id) => get().versions.find((v) => v.id === id),

      setActiveVersion: (id) => {
        if (get().versions.some((v) => v.id === id)) {
          set({ activeVersionId: id });
        }
      },

      updateActiveVersion: (updates) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === state.activeVersionId
              ? { ...v, ...updates, updatedAt: new Date().toISOString() }
              : v
          ),
        }));
      },

      updateVersion: (id, updates) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === id
              ? { ...v, ...updates, updatedAt: new Date().toISOString() }
              : v
          ),
        }));
      },

      createVersion: (name = "New Version") => {
        const version = createEmptyVersion(name);
        set((state) => ({
          versions: [...state.versions, version],
          activeVersionId: version.id,
        }));
      },

      duplicateVersion: (name) => {
        const active = get().getActiveVersion();
        if (!active) return undefined;
        const clone = cloneVersion(active, name ?? `${active.name} (Copy)`);
        set((state) => ({
          versions: [...state.versions, clone],
          activeVersionId: clone.id,
        }));
        return clone;
      },

      duplicateFromSource: (sourceVersionId, name) => {
        const source = get().getVersionById(sourceVersionId);
        if (!source) return;
        const clone = cloneVersion(source, name);
        set((state) => ({
          versions: [...state.versions, clone],
          activeVersionId: clone.id,
        }));
      },

      createBlankWithContext: (name, jobText, jobUrl) => {
        const version = createEmptyVersion(name);
        if (jobText?.trim()) {
          version.jobDescription = { url: jobUrl ?? "", text: jobText.trim() };
        }
        set((state) => ({
          versions: [...state.versions, version],
          activeVersionId: version.id,
        }));
      },

      renameVersion: (id, name) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === id
              ? { ...v, name, updatedAt: new Date().toISOString() }
              : v
          ),
        }));
      },

      deleteVersion: (id) => {
        const { versions, activeVersionId } = get();
        if (versions.length <= 1) return;
        const filtered = versions.filter((v) => v.id !== id);
        set({
          versions: filtered,
          activeVersionId:
            activeVersionId === id ? filtered[0].id : activeVersionId,
        });
      },

      setAiRecommendations: (type, recommendations, metaKey) => {
        const active = get().getActiveVersion();
        if (!active) return;
        const merged = mergeRecommendationsByType(
          active.aiRecommendations,
          type,
          recommendations
        );
        const now = new Date().toISOString();
        get().updateActiveVersion({
          aiRecommendations: merged,
          aiMeta: {
            ...active.aiMeta,
            ...(metaKey ? { [metaKey]: now } : {}),
          },
        });
      },

      applyRecommendation: (id) => {
        const active = get().getActiveVersion();
        if (!active) return false;
        const rec = active.aiRecommendations.find((r) => r.id === id);
        if (!rec || !rec.suggestedText || rec.status !== "open") return false;

        const updated = applyRecommendationToVersion(active, rec);
        if (!updated) return false;

        updated.aiRecommendations = updated.aiRecommendations.map((r) =>
          r.id === id ? { ...r, status: "applied" as const } : r
        );
        get().updateActiveVersion({
          ...updated,
          aiRecommendations: updated.aiRecommendations,
        });
        return true;
      },

      applyAllSpellRecommendations: () => {
        const active = get().getActiveVersion();
        if (!active) return;
        const updated = applyAllSpellFixes(active);
        get().updateActiveVersion({
          ...updated,
          aiRecommendations: updated.aiRecommendations,
        });
      },

      dismissRecommendation: (id) => {
        const active = get().getActiveVersion();
        if (!active) return;
        get().updateActiveVersion({
          aiRecommendations: active.aiRecommendations.map((r) =>
            r.id === id ? { ...r, status: "dismissed" as const } : r
          ),
        });
      },

      getOpenRecommendationCount: (section) => {
        const active = get().getActiveVersion();
        if (!active) return 0;
        return active.aiRecommendations.filter(
          (r) =>
            r.status === "open" &&
            (section === undefined || r.section === section)
        ).length;
      },

      createTailoredFromSource: async (sourceVersionId, jobText, options) => {
        const source =
          get().getVersionById(sourceVersionId) ?? get().getActiveVersion();
        if (!source || !jobText.trim()) return;

        let updates: Partial<ResumeVersion> = tailorResumeLocally(source, jobText);
        let versionName =
          options?.name?.trim() || extractJobTitle(jobText);
        let tailorRecs: AiRecommendation[] = [];

        try {
          const data = await fetchTailorAi(source, jobText, "create");
          if (data) {
            updates = {
              ...updates,
              ...(data.summary && { summary: data.summary }),
              ...(data.skillGroups && { skillGroups: data.skillGroups }),
              ...(data.experience && { experience: data.experience }),
            };
            if (!options?.name?.trim() && data.suggestedName) {
              versionName = data.suggestedName;
            }
            if (data.recommendations) tailorRecs = data.recommendations;
          }
        } catch {
          /* local fallback already applied */
        }

        const clone = cloneVersion(source, versionName);
        Object.assign(clone, updates, {
          jobDescription: {
            url: options?.jobUrl ?? source.jobDescription?.url ?? "",
            text: jobText,
          },
          aiRecommendations: tailorRecs,
          aiMeta: {
            lastTailorAt: new Date().toISOString(),
            sourceVersionId: source.id,
          },
        });

        set((state) => ({
          versions: [...state.versions, clone],
          activeVersionId: clone.id,
        }));
      },

      adjustCurrentForJob: async (jobText, sourceVersionId) => {
        const active = get().getActiveVersion();
        const source = sourceVersionId
          ? get().getVersionById(sourceVersionId) ?? active
          : active;
        if (!active || !source || !jobText.trim()) return;

        let contentUpdates: Partial<ResumeVersion> = {
          ...tailorResumeLocally(source, jobText),
          jobDescription: {
            url: active.jobDescription?.url ?? "",
            text: jobText,
          },
        };

        let tailorRecs: AiRecommendation[] = [];

        try {
          const data = await fetchTailorAi(source, jobText, "adjust");
          if (data) {
            contentUpdates = {
              ...contentUpdates,
              ...(data.summary && { summary: data.summary }),
              ...(data.skillGroups && { skillGroups: data.skillGroups }),
              ...(data.experience && { experience: data.experience }),
            };
            if (data.recommendations) tailorRecs = data.recommendations;
          }
        } catch {
          /* local fallback */
        }

        const mergedRecs = mergeRecommendationsByType(
          active.aiRecommendations,
          "tailor",
          tailorRecs
        );

        get().updateActiveVersion({
          ...contentUpdates,
          aiRecommendations: mergedRecs,
          aiMeta: {
            ...active.aiMeta,
            lastTailorAt: new Date().toISOString(),
            sourceVersionId: source.id,
          },
        });
      },
    }),
    {
      name: "resume-redox-storage",
      skipHydration: true,
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as {
          activeVersionId?: string;
          versions?: Array<
            ResumeVersion & {
              jobDescription?: { url: string; text: string };
              aiRecommendations?: AiRecommendation[];
              aiMeta?: ResumeVersion["aiMeta"];
            }
          >;
        };
        if (state.versions) {
          state.versions = state.versions.map((v) =>
            withAiDefaults({
              ...v,
              templateId: (v as ResumeVersion).templateId ?? "classic",
              jobDescription: v.jobDescription ?? { url: "", text: "" },
              aiRecommendations: v.aiRecommendations ?? [],
              aiMeta: v.aiMeta ?? {},
            })
          );
        }
        return state as { activeVersionId: string; versions: ResumeVersion[] };
      },
      merge: (persisted, current) => {
        const parsed = storeSchema.safeParse(persisted);
        if (parsed.success) return { ...current, ...parsed.data };
        return current;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.versions = state.versions
          .map((v) => withAiDefaults(v))
          .filter((v) => resumeVersionSchema.safeParse(v).success);
        if (state.versions.length === 0) {
          const initial = createInitialStore();
          state.versions = initial.versions;
          state.activeVersionId = initial.activeVersionId;
        }
        if (!state.versions.some((v) => v.id === state.activeVersionId)) {
          state.activeVersionId = state.versions[0].id;
        }
      },
    }
  )
);
