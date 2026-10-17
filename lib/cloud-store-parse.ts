import {
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_SECTION_ORDER,
  resumeVersionSchema,
  storeSchema,
  type ResumeVersion,
  type StoreState,
} from "./schema";
import { getDesignSettings, normalizeAccentColor } from "./design";
import { normalizeSectionOrder } from "./templates/section-order";

/**
 * Apply the same forward-compatible defaults used for local persistence so
 * older cloud documents (missing design, sectionOrder, etc.) can be recovered
 * instead of treated as unreadable.
 */
function migrateVersion(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const v = raw as Record<string, unknown> & {
    contact?: Record<string, unknown>;
    design?: ResumeVersion["design"];
    sectionOrder?: ResumeVersion["sectionOrder"];
    education?: Array<Record<string, unknown>>;
    jobDescription?: { url: string; text: string };
    aiRecommendations?: ResumeVersion["aiRecommendations"];
    aiMeta?: ResumeVersion["aiMeta"];
    customSections?: ResumeVersion["customSections"];
  };

  const design = getDesignSettings({
    design: v.design ?? { ...DEFAULT_DESIGN_SETTINGS },
  });

  return {
    ...v,
    templateId: (v as { templateId?: string }).templateId ?? "classic",
    design: {
      ...design,
      accentColor: normalizeAccentColor(design.accentColor),
    },
    sectionOrder: normalizeSectionOrder(
      v.sectionOrder ?? [...DEFAULT_SECTION_ORDER]
    ),
    contact: {
      ...v.contact,
      headline:
        typeof v.contact?.headline === "string" ? v.contact.headline : "",
    },
    jobDescription: v.jobDescription ?? { url: "", text: "" },
    aiRecommendations: v.aiRecommendations ?? [],
    aiMeta: v.aiMeta ?? {},
    customSections: v.customSections ?? [],
    education: (v.education ?? []).map((edu) => ({
      ...edu,
      graduationDate:
        typeof edu.graduationDate === "string" ? edu.graduationDate : "",
    })),
  };
}

/**
 * Parse a cloud `resumeStores/{uid}` document into StoreState.
 * Returns null only when the payload cannot be recovered safely.
 */
export function parseCloudStoreData(raw: unknown): StoreState | null {
  const strict = storeSchema.safeParse(raw);
  if (strict.success) return strict.data;

  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { activeVersionId?: unknown; versions?: unknown };

  if (typeof obj.activeVersionId !== "string" || !Array.isArray(obj.versions)) {
    return null;
  }

  const versions: ResumeVersion[] = [];
  for (const entry of obj.versions) {
    const migrated = migrateVersion(entry);
    const parsed = resumeVersionSchema.safeParse(migrated);
    if (parsed.success) versions.push(parsed.data);
  }

  // Had resume entries but none could be recovered — treat as unreadable.
  if (obj.versions.length > 0 && versions.length === 0) return null;

  let activeVersionId = obj.activeVersionId;
  if (
    versions.length > 0 &&
    !versions.some((v) => v.id === activeVersionId)
  ) {
    activeVersionId = versions[0].id;
  }

  const result = storeSchema.safeParse({ activeVersionId, versions });
  return result.success ? result.data : null;
}
