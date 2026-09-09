import type {
  Contact,
  CustomSection,
  DesignSettings,
  Education,
  Experience,
  SkillGroup,
  ReorderableSectionId,
  ResumeVersion,
  TemplateId,
} from "@/lib/schema";
import {
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_SECTION_ORDER,
} from "@/lib/schema";
import { normalizeSectionOrder } from "@/lib/templates/section-order";
import { getDesignSettings } from "@/lib/design";

export type { TemplateId };

export type ResumeContent = {
  contact: Contact;
  summary: string;
  experience: Experience[];
  skillGroups: SkillGroup[];
  education: Education[];
  customSections: CustomSection[];
  design: DesignSettings;
  sectionOrder: ReorderableSectionId[];
};

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  atsNotes: string[];
};

export function toResumeContent(version: ResumeVersion): ResumeContent {
  return {
    contact: version.contact,
    summary: version.summary,
    experience: version.experience,
    skillGroups: version.skillGroups,
    education: version.education,
    customSections: version.customSections ?? [],
    design: getDesignSettings(version),
    sectionOrder: normalizeSectionOrder(
      version.sectionOrder ?? [...DEFAULT_SECTION_ORDER]
    ),
  };
}

export { DEFAULT_DESIGN_SETTINGS };
