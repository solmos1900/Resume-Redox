import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string(),
  headline: z.string().default(""),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedIn: z.string().optional(),
  linkedInHyperlink: z.boolean().default(true),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  location: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  bullets: z.array(z.string()),
});

export const skillGroupSchema = z.object({
  id: z.string(),
  category: z.string(),
  items: z.string(),
});

export const educationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  location: z.string(),
  details: z.string(),
  graduationDate: z.string().default(""),
});

/** Experience-like entry for user-defined sections (Projects, Leadership, etc.). */
export const customSectionEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  subtitle: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  bullets: z.array(z.string()),
});

export const customSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  entries: z.array(customSectionEntrySchema),
});

export const jobDescriptionSchema = z.object({
  url: z.string(),
  text: z.string(),
});

export const aiRecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(["roast", "spell", "tailor", "general"]),
  section: z.enum([
    "contact",
    "summary",
    "experience",
    "skills",
    "education",
    "overall",
  ]),
  targetId: z.string().optional(),
  fieldPath: z.string().optional(),
  severity: z.enum(["critical", "warning", "suggestion", "praise"]),
  title: z.string(),
  message: z.string(),
  originalText: z.string().optional(),
  suggestedText: z.string().optional(),
  createdAt: z.string(),
  status: z.enum(["open", "applied", "dismissed"]),
});

export const aiMetaSchema = z.object({
  lastRoastAt: z.string().optional(),
  lastSpellCheckAt: z.string().optional(),
  lastRecommendAt: z.string().optional(),
  lastTailorAt: z.string().optional(),
  sourceVersionId: z.string().optional(),
});

export const templateIdSchema = z.enum([
  "classic",
  "modern",
  "professional",
  "executive",
  "structured",
  "accent",
]);

export const designFontFamilySchema = z.enum([
  "arial",
  "calibri",
  "georgia",
  "garamond",
  "times",
]);

export const designFontSizeSchema = z.enum(["small", "medium", "large"]);

export const designSpacingSchema = z.enum([
  "comfortable",
  "compact",
  "tight",
]);

export const designSettingsSchema = z.object({
  fontFamily: designFontFamilySchema.default("arial"),
  fontSize: designFontSizeSchema.default("medium"),
  /** Hex accent for Accent-template tokens (titles / headline / rules). */
  accentColor: z.string().default("#1e5aa8"),
  spacing: designSpacingSchema.default("comfortable"),
});

export const reorderableSectionIdSchema = z.enum([
  "summary",
  "experience",
  "custom",
  "skills",
  "education",
]);

export const DEFAULT_DESIGN_SETTINGS = {
  fontFamily: "arial" as const,
  fontSize: "medium" as const,
  accentColor: "#1e5aa8",
  spacing: "comfortable" as const,
};

export const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "custom",
  "skills",
  "education",
] as const;

export const resumeVersionSchema = z.object({
  id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
  templateId: templateIdSchema,
  design: designSettingsSchema.default(DEFAULT_DESIGN_SETTINGS),
  /** Body section order; contact is always pinned above this list. */
  sectionOrder: z
    .array(reorderableSectionIdSchema)
    .default([...DEFAULT_SECTION_ORDER]),
  contact: contactSchema,
  summary: z.string(),
  experience: z.array(experienceSchema),
  skillGroups: z.array(skillGroupSchema),
  education: z.array(educationSchema),
  customSections: z.array(customSectionSchema).default([]),
  jobDescription: jobDescriptionSchema,
  aiRecommendations: z.array(aiRecommendationSchema),
  aiMeta: aiMetaSchema.optional(),
});

export const storeSchema = z.object({
  activeVersionId: z.string(),
  versions: z.array(resumeVersionSchema),
});

export type Contact = z.infer<typeof contactSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Education = z.infer<typeof educationSchema>;
export type CustomSectionEntry = z.infer<typeof customSectionEntrySchema>;
export type CustomSection = z.infer<typeof customSectionSchema>;
export type JobDescription = z.infer<typeof jobDescriptionSchema>;
export type AiRecommendation = z.infer<typeof aiRecommendationSchema>;
export type AiMeta = z.infer<typeof aiMetaSchema>;
export type AiRecommendationType = AiRecommendation["type"];
export type AiRecommendationSection = AiRecommendation["section"];
export type TemplateId = z.infer<typeof templateIdSchema>;
export type DesignFontFamily = z.infer<typeof designFontFamilySchema>;
export type DesignFontSize = z.infer<typeof designFontSizeSchema>;
export type DesignSpacing = z.infer<typeof designSpacingSchema>;
export type DesignSettings = z.infer<typeof designSettingsSchema>;
export type ReorderableSectionId = z.infer<typeof reorderableSectionIdSchema>;
export type ResumeVersion = z.infer<typeof resumeVersionSchema>;
export type StoreState = z.infer<typeof storeSchema>;

export function createEmptyVersion(name: string): ResumeVersion {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    updatedAt: now,
    templateId: "classic",
    design: { ...DEFAULT_DESIGN_SETTINGS },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    contact: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      linkedIn: "",
      linkedInHyperlink: true,
    },
    summary: "",
    experience: [],
    skillGroups: [],
    education: [],
    customSections: [],
    jobDescription: { url: "", text: "" },
    aiRecommendations: [],
    aiMeta: {},
  };
}
