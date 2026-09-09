import type {
  Contact,
  CustomSection,
  Education,
  Experience,
  SkillGroup,
} from "@/lib/schema";

export type ImportSourceFormat = "pdf" | "docx";

export type ParsedResumeFields = {
  contact: Contact;
  summary: string;
  experience: Experience[];
  skillGroups: SkillGroup[];
  education: Education[];
  customSections: CustomSection[];
};

export type ImportParseResult = {
  ok: true;
  format: ImportSourceFormat;
  fileName: string;
  /** Raw extracted text (for debugging / empty-state messaging). */
  text: string;
  fields: ParsedResumeFields;
  /** Suggested sidebar name for "Add as new". */
  suggestedName: string;
  warnings: string[];
  /** True when text extract looks empty (e.g. image-only PDF). */
  likelyImageOnly: boolean;
};

export type ImportParseError = {
  ok: false;
  error: string;
  format?: ImportSourceFormat;
  fileName?: string;
  likelyImageOnly?: boolean;
};
