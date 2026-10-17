import type {
  Education,
  Experience,
  SkillGroup,
} from "@/lib/schema";
import type { ResumeContent } from "@/lib/templates/types";
import {
  customSectionToExperience,
  getResumeSections,
} from "@/lib/templates/sections";
import { normalizeSectionOrder } from "@/lib/templates/section-order";
import {
  formatCustomSectionTitle,
  getAtsSectionTitle,
  getAtsSummaryTitle,
} from "@/lib/templates/ats-sections";
import { formatDateRange } from "@/lib/utils";

/**
 * Structured export sections in the same order as live templates.
 * Used by DOCX and TXT so content/order stay in sync with preview/PDF.
 */
export type ExportBlock =
  | { kind: "summary"; title: string; body: string }
  | { kind: "experience"; title: string; jobs: Experience[] }
  | { kind: "skills"; title: string; groups: SkillGroup[] }
  | { kind: "education"; title: string; entries: Education[] }
  | { kind: "custom"; title: string; jobs: Experience[] };

export function getExportBlocks(data: ResumeContent): ExportBlock[] {
  const {
    hasSummary,
    hasExperience,
    hasSkills,
    hasEducation,
    visibleCustomSections,
  } = getResumeSections(data);

  const headingCase = data.atsHeadingCase ?? "title";
  const blocks: ExportBlock[] = [];

  for (const id of normalizeSectionOrder(data.sectionOrder)) {
    switch (id) {
      case "summary":
        if (hasSummary) {
          blocks.push({
            kind: "summary",
            title: getAtsSummaryTitle(data.atsSummaryKind, headingCase),
            body: data.summary,
          });
        }
        break;
      case "experience":
        if (hasExperience) {
          blocks.push({
            kind: "experience",
            title: getAtsSectionTitle("experience", headingCase),
            jobs: data.experience,
          });
        }
        break;
      case "custom":
        for (const section of visibleCustomSections) {
          blocks.push({
            kind: "custom",
            title: formatCustomSectionTitle(section.title, headingCase),
            jobs: customSectionToExperience(section),
          });
        }
        break;
      case "skills":
        if (hasSkills) {
          blocks.push({
            kind: "skills",
            title: getAtsSectionTitle("skills", headingCase),
            groups: data.skillGroups,
          });
        }
        break;
      case "education":
        if (hasEducation) {
          blocks.push({
            kind: "education",
            title: getAtsSectionTitle("education", headingCase),
            entries: data.education,
          });
        }
        break;
      default:
        break;
    }
  }

  return blocks;
}

export function formatExportDateRange(
  startDate: string,
  endDate: string,
  current: boolean
): string {
  return formatDateRange(startDate, endDate, current);
}
