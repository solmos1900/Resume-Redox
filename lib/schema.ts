import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedIn: z.string().optional(),
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
]);

export const resumeVersionSchema = z.object({
  id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
  templateId: templateIdSchema,
  contact: contactSchema,
  summary: z.string(),
  experience: z.array(experienceSchema),
  skillGroups: z.array(skillGroupSchema),
  education: z.array(educationSchema),
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
export type JobDescription = z.infer<typeof jobDescriptionSchema>;
export type AiRecommendation = z.infer<typeof aiRecommendationSchema>;
export type AiMeta = z.infer<typeof aiMetaSchema>;
export type AiRecommendationType = AiRecommendation["type"];
export type AiRecommendationSection = AiRecommendation["section"];
export type TemplateId = z.infer<typeof templateIdSchema>;
export type ResumeVersion = z.infer<typeof resumeVersionSchema>;
export type StoreState = z.infer<typeof storeSchema>;

export function createEmptyVersion(name: string): ResumeVersion {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    updatedAt: now,
    templateId: "classic",
    contact: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedIn: "",
    },
    summary: "",
    experience: [],
    skillGroups: [],
    education: [],
    jobDescription: { url: "", text: "" },
    aiRecommendations: [],
    aiMeta: {},
  };
}
