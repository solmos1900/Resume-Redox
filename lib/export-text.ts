import type { ResumeVersion, Experience } from "./schema";
import { toResumeContent, type ResumeContent } from "./templates/types";
import { useResumeSections, customSectionToExperience } from "./templates/sections";
import { getExportFilename } from "./export";
import { downloadBlob } from "./download-history";

function formatExperienceLines(jobs: Experience[]): string[] {
  const lines: string[] = [];
  for (const job of jobs) {
    const companyLine = [job.company, job.location].filter((s) => s.trim()).join(", ");
    const bullets = job.bullets.filter((b) => b.trim());
    if (!companyLine && !job.title.trim() && bullets.length === 0) continue;

    const dateRange = [job.startDate, job.current ? "Present" : job.endDate]
      .filter(Boolean)
      .join(" – ");

    if (companyLine) lines.push(companyLine);
    const titleLine = [job.title, dateRange].filter((s) => s.trim()).join("  |  ");
    if (titleLine) lines.push(titleLine);
    for (const bullet of bullets) lines.push(`  - ${bullet}`);
    lines.push("");
  }
  return lines;
}

function buildResumeText(data: ResumeContent): string {
  const {
    contactLine,
    hasSummary,
    hasExperience,
    hasSkills,
    hasEducation,
    visibleCustomSections,
  } = useResumeSections(data);

  const lines: string[] = [];

  lines.push(data.contact.fullName || "Untitled");
  if (data.contact.headline.trim()) lines.push(data.contact.headline);
  if (contactLine) lines.push(contactLine);
  lines.push("");

  if (hasSummary) {
    lines.push("SUMMARY");
    lines.push(data.summary);
    lines.push("");
  }

  if (hasExperience) {
    lines.push("EXPERIENCE");
    lines.push(...formatExperienceLines(data.experience));
  }

  if (hasSkills) {
    lines.push("SKILLS");
    for (const group of data.skillGroups) {
      if (!group.category.trim() && !group.items.trim()) continue;
      lines.push(group.category.trim() ? `${group.category}: ${group.items}` : group.items);
    }
    lines.push("");
  }

  if (hasEducation) {
    lines.push("EDUCATION");
    for (const edu of data.education) {
      if (!edu.institution.trim() && !edu.details.trim()) continue;
      const line = [edu.institution, edu.location].filter((s) => s.trim()).join(", ");
      lines.push([line, edu.graduationDate].filter(Boolean).join("  |  "));
      if (edu.details.trim()) lines.push(edu.details);
    }
    lines.push("");
  }

  for (const section of visibleCustomSections) {
    lines.push((section.title.trim() || "Section").toUpperCase());
    lines.push(...formatExperienceLines(customSectionToExperience(section)));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function downloadResumeAsText(version: ResumeVersion): void {
  const data = toResumeContent(version);
  const blob = new Blob([buildResumeText(data)], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, getExportFilename(version), "txt");
}
