import type { ResumeVersion, Experience } from "./schema";
import { toResumeContent } from "./templates/types";
import { getExportBlocks, formatExportDateRange } from "./export/export-blocks";
import { useResumeSections } from "./templates/sections";
import { getExportFilename } from "./export";
import { downloadBlob } from "./download-history";

function formatExperienceLines(jobs: Experience[]): string[] {
  const lines: string[] = [];
  for (const job of jobs) {
    const companyLine = [job.company, job.location]
      .filter((s) => s.trim())
      .join(", ");
    const bullets = job.bullets.filter((b) => b.trim());
    if (!companyLine && !job.title.trim() && bullets.length === 0) continue;

    const dateRange = formatExportDateRange(
      job.startDate,
      job.endDate,
      job.current
    );

    if (companyLine) lines.push(companyLine);
    const titleLine = [job.title, dateRange].filter((s) => s.trim()).join("  |  ");
    if (titleLine) lines.push(titleLine);
    for (const bullet of bullets) lines.push(`  - ${bullet}`);
    lines.push("");
  }
  return lines;
}

function buildResumeText(version: ResumeVersion): string {
  const data = toResumeContent(version);
  const { contactLine } = useResumeSections(data);
  const blocks = getExportBlocks(data);

  const lines: string[] = [];

  lines.push(data.contact.fullName || "Untitled");
  if (data.contact.headline.trim()) lines.push(data.contact.headline);
  if (contactLine) lines.push(contactLine);
  lines.push("");

  for (const block of blocks) {
    lines.push(block.title.toUpperCase());
    if (block.kind === "summary") {
      lines.push(block.body);
      lines.push("");
    } else if (block.kind === "experience" || block.kind === "custom") {
      lines.push(...formatExperienceLines(block.jobs));
    } else if (block.kind === "skills") {
      for (const group of block.groups) {
        if (!group.category.trim() && !group.items.trim()) continue;
        lines.push(
          group.category.trim()
            ? `${group.category}: ${group.items}`
            : group.items
        );
      }
      lines.push("");
    } else if (block.kind === "education") {
      for (const edu of block.entries) {
        if (!edu.institution.trim() && !edu.details.trim()) continue;
        const line = [edu.institution, edu.location]
          .filter((s) => s.trim())
          .join(", ");
        lines.push([line, edu.graduationDate].filter(Boolean).join("  |  "));
        if (edu.details.trim()) lines.push(edu.details);
      }
      lines.push("");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function downloadResumeAsText(version: ResumeVersion): void {
  const blob = new Blob([buildResumeText(version)], {
    type: "text/plain;charset=utf-8",
  });
  downloadBlob(blob, getExportFilename(version), "txt");
}
