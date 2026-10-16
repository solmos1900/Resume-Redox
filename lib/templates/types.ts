import type {
  AtsContactLayout,
  AtsHeadingCase,
  AtsSummaryHeading,
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
import type { AtsSummaryKind } from "@/lib/templates/ats-sections";

export type { TemplateId };

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  atsNotes: string[];
};

export type ResumeContent = {
  contact: Contact;
  summary: string;
  experience: Experience[];
  skillGroups: SkillGroup[];
  education: Education[];
  customSections: CustomSection[];
  design: DesignSettings;
  sectionOrder: ReorderableSectionId[];
  atsContactLayout: AtsContactLayout;
  atsSummaryKind: AtsSummaryKind;
  atsHeadingCase: AtsHeadingCase;
};

function normalizeSummaryKind(value: AtsSummaryHeading | undefined): AtsSummaryKind {
  if (!value) return "summary";
  const v = value.toLowerCase();
  return v === "profile" ? "profile" : "summary";
}

export function toResumeContent(version: ResumeVersion): ResumeContent {
  return {
    contact: {
      ...version.contact,
      website: version.contact.website ?? "",
    },
    summary: version.summary,
    experience: version.experience,
    skillGroups: version.skillGroups,
    education: version.education,
    customSections: version.customSections ?? [],
    design: getDesignSettings(version),
    sectionOrder: normalizeSectionOrder(
      version.sectionOrder ?? [...DEFAULT_SECTION_ORDER]
    ),
    atsContactLayout: version.atsContactLayout ?? "inline",
    atsSummaryKind: normalizeSummaryKind(version.atsSummaryHeading),
    atsHeadingCase: version.atsHeadingCase ?? "title",
  };
}

export { DEFAULT_DESIGN_SETTINGS };
