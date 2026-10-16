import { z } from "zod";
import {
  atsContactLayoutSchema,
  atsHeadingCaseSchema,
  atsSummaryHeadingSchema,
  designFontFamilySchema,
  designFontSizeSchema,
  designSpacingSchema,
  reorderableSectionIdSchema,
  resumeVersionSchema,
  templateIdSchema,
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_SECTION_ORDER,
} from "@/lib/schema";

/** Hard caps for PDF export payloads — reject oversized abuse strings/arrays. */
export const PDF_EXPORT_MAX_BODY_BYTES = 256 * 1024; // 256 KiB
export const PDF_EXPORT_MAX_STRING = 8_000;
export const PDF_EXPORT_MAX_LONG_TEXT = 20_000;
export const PDF_EXPORT_MAX_ARRAY = 40;
export const PDF_EXPORT_MAX_BULLETS = 40;

const boundedShort = z.string().max(PDF_EXPORT_MAX_STRING);
const boundedLong = z.string().max(PDF_EXPORT_MAX_LONG_TEXT);

const exportContactSchema = z.object({
  fullName: boundedShort,
  headline: boundedShort.default(""),
  email: boundedShort,
  phone: boundedShort,
  location: boundedShort,
  linkedIn: boundedShort.optional(),
  /** Older clients may omit website; default keeps saved resumes valid. */
  website: boundedShort.optional().default(""),
  linkedInHyperlink: z.boolean().default(true),
});

const exportExperienceSchema = z.object({
  id: boundedShort,
  company: boundedShort,
  location: boundedShort,
  title: boundedShort,
  startDate: boundedShort,
  endDate: boundedShort,
  current: z.boolean(),
  bullets: z.array(boundedLong).max(PDF_EXPORT_MAX_BULLETS),
});

const exportSkillGroupSchema = z.object({
  id: boundedShort,
  category: boundedShort,
  items: boundedLong,
});

const exportEducationSchema = z.object({
  id: boundedShort,
  institution: boundedShort,
  location: boundedShort,
  details: boundedLong,
  graduationDate: boundedShort.default(""),
});

const exportCustomEntrySchema = z.object({
  id: boundedShort,
  name: boundedShort,
  location: boundedShort,
  subtitle: boundedShort,
  startDate: boundedShort,
  endDate: boundedShort,
  current: z.boolean(),
  bullets: z.array(boundedLong).max(PDF_EXPORT_MAX_BULLETS),
});

const exportCustomSectionSchema = z.object({
  id: boundedShort,
  title: boundedShort,
  entries: z.array(exportCustomEntrySchema).max(PDF_EXPORT_MAX_ARRAY),
});

const exportJobDescriptionSchema = z.object({
  url: boundedShort,
  text: boundedLong,
});

const exportAiRecommendationSchema = z.object({
  id: boundedShort,
  type: z.enum(["roast", "spell", "tailor", "general"]),
  section: z.enum([
    "contact",
    "summary",
    "experience",
    "skills",
    "education",
    "overall",
  ]),
  targetId: boundedShort.optional(),
  fieldPath: boundedShort.optional(),
  severity: z.enum(["critical", "warning", "suggestion", "praise"]),
  title: boundedShort,
  message: boundedLong,
  originalText: boundedLong.optional(),
  suggestedText: boundedLong.optional(),
  createdAt: boundedShort,
  status: z.enum(["open", "applied", "dismissed"]),
});

const exportDesignSettingsSchema = z.object({
  fontFamily: designFontFamilySchema.default("arial"),
  fontSize: designFontSizeSchema.default("medium"),
  accentColor: z.string().max(32).default("#1e5aa8"),
  spacing: designSpacingSchema.default("comfortable"),
});

/**
 * Stricter than `resumeVersionSchema` for the public PDF API:
 * max string/array sizes to bound Chromium HTML size and CPU.
 */
export const resumeVersionExportSchema = z.object({
  id: boundedShort,
  name: boundedShort,
  updatedAt: boundedShort,
  templateId: templateIdSchema,
  design: exportDesignSettingsSchema.default(DEFAULT_DESIGN_SETTINGS),
  sectionOrder: z
    .array(reorderableSectionIdSchema)
    .max(PDF_EXPORT_MAX_ARRAY)
    .default([...DEFAULT_SECTION_ORDER]),
  /**
   * ATS fields from #39. Defaults match resumeVersionSchema so older clients
   * and saved resumes that omit them still parse and render.
   */
  atsContactLayout: atsContactLayoutSchema.default("inline"),
  atsSummaryHeading: atsSummaryHeadingSchema.default("summary"),
  atsHeadingCase: atsHeadingCaseSchema.default("title"),
  contact: exportContactSchema,
  summary: boundedLong,
  experience: z.array(exportExperienceSchema).max(PDF_EXPORT_MAX_ARRAY),
  skillGroups: z.array(exportSkillGroupSchema).max(PDF_EXPORT_MAX_ARRAY),
  education: z.array(exportEducationSchema).max(PDF_EXPORT_MAX_ARRAY),
  customSections: z
    .array(exportCustomSectionSchema)
    .max(PDF_EXPORT_MAX_ARRAY)
    .default([]),
  jobDescription: exportJobDescriptionSchema,
  aiRecommendations: z
    .array(exportAiRecommendationSchema)
    .max(PDF_EXPORT_MAX_ARRAY),
  aiMeta: z
    .object({
      lastRoastAt: boundedShort.optional(),
      lastSpellCheckAt: boundedShort.optional(),
      lastRecommendAt: boundedShort.optional(),
      lastTailorAt: boundedShort.optional(),
      sourceVersionId: boundedShort.optional(),
    })
    .optional(),
});

export type ResumeVersionExport = z.infer<typeof resumeVersionExportSchema>;

export function parseExportResumeVersion(input: unknown):
  | { ok: true; data: ResumeVersionExport }
  | { ok: false; error: z.ZodError } {
  // Ensure base shape is still a ResumeVersion, then enforce size caps.
  const base = resumeVersionSchema.safeParse(input);
  if (!base.success) {
    return { ok: false, error: base.error };
  }
  const sized = resumeVersionExportSchema.safeParse(input);
  if (!sized.success) {
    return { ok: false, error: sized.error };
  }
  return { ok: true, data: sized.data };
}
