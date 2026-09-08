import type {
  Education,
  Experience,
  SkillGroup,
} from "@/lib/schema";
import type { ResumeContent } from "@/lib/templates/types";
import {
  customSectionToExperience,
  useResumeSections,
} from "@/lib/templates/sections";
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
  } = useResumeSections(data);

  const blocks: ExportBlock[] = [];

  if (hasSummary) {
    blocks.push({ kind: "summary", title: "Summary", body: data.summary });
  }

  if (hasExperience) {
    blocks.push({
      kind: "experience",
      title: "Experience",
      jobs: data.experience,
    });
  }

  for (const section of visibleCustomSections) {
    blocks.push({
      kind: "custom",
      title: section.title.trim() || "Section",
      jobs: customSectionToExperience(section),
    });
  }

  if (hasSkills) {
    blocks.push({
      kind: "skills",
      title: "Skills",
      groups: data.skillGroups,
    });
  }

  if (hasEducation) {
    blocks.push({
      kind: "education",
      title: "Education",
      entries: data.education,
    });
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
