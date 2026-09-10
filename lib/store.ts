import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createEmptyVersion,
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_SECTION_ORDER,
  resumeVersionSchema,
  storeSchema,
  type AiRecommendation,
  type ResumeVersion,
} from "./schema";
import { normalizeSectionOrder } from "./templates/section-order";
import { createInitialStore } from "./seed-data";
import { getDesignSettings, normalizeAccentColor } from "./design";

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
    jobUrl?: string,
    templateId?: ResumeVersion["templateId"]
  ) => void;
  renameVersion: (id: string, name: string) => void;
  deleteVersion: (id: string) => void;
  /** Add imported resumes as new entries (does not replace existing ones). */
  importVersions: (versions: ResumeVersion[]) => number;
  /** Overwrite the active resume with imported content (keeps the same entry id). */
  replaceActiveWithImported: (version: ResumeVersion) => boolean;
};

function cloneVersion(version: ResumeVersion, newName: string): ResumeVersion {
  const json = JSON.stringify(version);
  const clone = JSON.parse(json) as ResumeVersion;
  clone.id = crypto.randomUUID();
  clone.name = newName;
  clone.updatedAt = new Date().toISOString();
  clone.templateId = version.templateId ?? "classic";
  clone.design = {
    ...DEFAULT_DESIGN_SETTINGS,
    ...version.design,
    accentColor: normalizeAccentColor(
      version.design?.accentColor ?? DEFAULT_DESIGN_SETTINGS.accentColor
    ),
  };
  clone.sectionOrder = normalizeSectionOrder(version.sectionOrder);
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
  clone.customSections = (clone.customSections ?? []).map((section) => ({
    ...section,
    id: crypto.randomUUID(),
    entries: section.entries.map((entry) => ({
      ...entry,
      id: crypto.randomUUID(),
    })),
  }));
  return clone;
}

function withDefaults(v: Partial<ResumeVersion>): ResumeVersion {
  const design = getDesignSettings(v as ResumeVersion);
  return {
    ...v,
    templateId: v.templateId ?? "classic",
    design: {
      ...design,
      accentColor: normalizeAccentColor(design.accentColor),
    },
    sectionOrder: normalizeSectionOrder(v.sectionOrder),
    jobDescription: v.jobDescription ?? { url: "", text: "" },
    aiRecommendations: v.aiRecommendations ?? [],
    aiMeta: v.aiMeta ?? {},
    customSections: v.customSections ?? [],
  } as ResumeVersion;
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

      createBlankWithContext: (name, jobText, jobUrl, templateId) => {
        const version = createEmptyVersion(name);
        if (templateId) {
          version.templateId = templateId;
        }
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

      importVersions: (incoming) => {
        if (incoming.length === 0) return 0;

        const existingNames = new Set(
          get().versions.map((v) => v.name.trim().toLowerCase())
        );

        const cloned = incoming.map((version) => {
          let name = version.name.trim() || "Imported Resume";
          if (existingNames.has(name.toLowerCase())) {
            name = `${name} (Imported)`;
          }
          existingNames.add(name.toLowerCase());
          return cloneVersion(version, name);
        });

        set((state) => ({
          versions: [...state.versions, ...cloned],
          activeVersionId: cloned[0].id,
        }));

        return cloned.length;
      },

      replaceActiveWithImported: (incoming) => {
        const active = get().getActiveVersion();
        if (!active) return false;

        const cloned = cloneVersion(
          incoming,
          incoming.name.trim() || active.name || "Imported Resume"
        );

        get().updateActiveVersion({
          name: cloned.name,
          templateId: cloned.templateId,
          design: cloned.design ?? { ...DEFAULT_DESIGN_SETTINGS },
          sectionOrder: normalizeSectionOrder(
            cloned.sectionOrder ?? [...DEFAULT_SECTION_ORDER]
          ),
          contact: cloned.contact,
          summary: cloned.summary,
          experience: cloned.experience,
          skillGroups: cloned.skillGroups,
          education: cloned.education,
          customSections: cloned.customSections,
          jobDescription: cloned.jobDescription,
          aiRecommendations: cloned.aiRecommendations,
          aiMeta: cloned.aiMeta,
        });

        return true;
      },
    }),
    {
      name: "resume-redox-storage",
      skipHydration: true,
      version: 8,
      migrate: (persisted) => {
        const state = persisted as {
          activeVersionId?: string;
          versions?: Array<
            ResumeVersion & {
              jobDescription?: { url: string; text: string };
              aiRecommendations?: AiRecommendation[];
              aiMeta?: ResumeVersion["aiMeta"];
              customSections?: ResumeVersion["customSections"];
              design?: ResumeVersion["design"];
              sectionOrder?: ResumeVersion["sectionOrder"];
              education?: Array<
                ResumeVersion["education"][number] & {
                  graduationDate?: string;
                }
              >;
              contact?: ResumeVersion["contact"] & { headline?: string };
            }
          >;
        };
        if (state.versions) {
          state.versions = state.versions.map((v) =>
            withDefaults({
              ...v,
              templateId: (v as ResumeVersion).templateId ?? "classic",
              design: v.design ?? { ...DEFAULT_DESIGN_SETTINGS },
              sectionOrder: normalizeSectionOrder(
                v.sectionOrder ?? [...DEFAULT_SECTION_ORDER]
              ),
              contact: {
                ...v.contact,
                headline: v.contact?.headline ?? "",
              },
              jobDescription: v.jobDescription ?? { url: "", text: "" },
              aiRecommendations: v.aiRecommendations ?? [],
              aiMeta: v.aiMeta ?? {},
              customSections: v.customSections ?? [],
              education: (v.education ?? []).map((edu) => ({
                ...edu,
                graduationDate: edu.graduationDate ?? "",
              })),
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
          .map((v) => withDefaults(v))
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
