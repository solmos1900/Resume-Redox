import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ResumeVersion, Contact } from "./schema";
import { toResumeContent, type ResumeContent } from "./templates/types";
import { useResumeSections, customSectionToExperience } from "./templates/sections";
import type { Experience } from "./schema";
import { getExportFilename } from "./export";
import { downloadBlob } from "./download-history";
import { hasContactLineInfo, normalizeLinkedInUrl } from "./contact-url";

const HEADING_SPACING = { before: 240, after: 80 };
const BODY_SPACING = { after: 100 };

function contactLineRuns(contact: Contact, size: number): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = [];
  const addSeparator = () => {
    if (runs.length > 0) runs.push(new TextRun({ text: "  •  ", size }));
  };

  if (contact.phone?.trim()) {
    addSeparator();
    runs.push(new TextRun({ text: contact.phone.trim(), size }));
  }
  if (contact.email?.trim()) {
    addSeparator();
    runs.push(new TextRun({ text: contact.email.trim(), size }));
  }
  if (contact.linkedIn?.trim()) {
    addSeparator();
    const linkedIn = contact.linkedIn.trim();
    runs.push(
      contact.linkedInHyperlink
        ? new ExternalHyperlink({
            link: normalizeLinkedInUrl(linkedIn),
            children: [new TextRun({ text: linkedIn, size, underline: {} })],
          })
        : new TextRun({ text: linkedIn, size })
    );
  }
  if (contact.location?.trim()) {
    addSeparator();
    runs.push(new TextRun({ text: contact.location.trim(), size }));
  }

  return runs;
}

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: HEADING_SPACING,
    children: [new TextRun({ text: text.toUpperCase(), bold: true })],
  });
}

function experienceParagraphs(jobs: Experience[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const job of jobs) {
    const companyLine = [job.company, job.location].filter((s) => s.trim()).join(", ");
    const bullets = job.bullets.filter((b) => b.trim());
    if (!companyLine && !job.title.trim() && bullets.length === 0) continue;

    if (companyLine) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 160, after: 20 },
          children: [new TextRun({ text: companyLine, bold: true })],
        })
      );
    }

    const dateRange = [job.startDate, job.current ? "Present" : job.endDate]
      .filter(Boolean)
      .join(" – ");
    if (job.title.trim() || dateRange) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            ...(job.title.trim() ? [new TextRun({ text: job.title, italics: true })] : []),
            ...(dateRange
              ? [new TextRun({ text: `\t${dateRange}`, italics: true })]
              : []),
          ],
        })
      );
    }

    for (const bullet of bullets) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: BODY_SPACING,
          children: [new TextRun({ text: bullet })],
        })
      );
    }
  }
  return paragraphs;
}

function buildDocxParagraphs(data: ResumeContent): Paragraph[] {
  const {
    hasSummary,
    hasExperience,
    hasSkills,
    hasEducation,
    visibleCustomSections,
  } = useResumeSections(data);

  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: data.contact.fullName || "Untitled", bold: true, size: 32 }),
      ],
    }),
  ];

  if (data.contact.headline.trim()) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: data.contact.headline, italics: true })],
      })
    );
  }

  if (hasContactLineInfo(data.contact)) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: contactLineRuns(data.contact, 20),
      })
    );
  }

  if (hasSummary) {
    paragraphs.push(heading("Summary"));
    paragraphs.push(
      new Paragraph({ spacing: BODY_SPACING, children: [new TextRun({ text: data.summary })] })
    );
  }

  if (hasExperience) {
    paragraphs.push(heading("Experience"));
    paragraphs.push(...experienceParagraphs(data.experience));
  }

  if (hasSkills) {
    paragraphs.push(heading("Skills"));
    for (const group of data.skillGroups) {
      if (!group.category.trim() && !group.items.trim()) continue;
      paragraphs.push(
        new Paragraph({
          spacing: BODY_SPACING,
          children: [
            ...(group.category.trim()
              ? [new TextRun({ text: `${group.category}: `, bold: true })]
              : []),
            new TextRun({ text: group.items }),
          ],
        })
      );
    }
  }

  if (hasEducation) {
    paragraphs.push(heading("Education"));
    for (const edu of data.education) {
      if (!edu.institution.trim() && !edu.details.trim()) continue;
      const line = [edu.institution, edu.location].filter((s) => s.trim()).join(", ");
      paragraphs.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            ...(line ? [new TextRun({ text: line, bold: true })] : []),
            ...(edu.graduationDate
              ? [new TextRun({ text: `\t${edu.graduationDate}` })]
              : []),
          ],
        })
      );
      if (edu.details.trim()) {
        paragraphs.push(
          new Paragraph({ spacing: BODY_SPACING, children: [new TextRun({ text: edu.details })] })
        );
      }
    }
  }

  for (const section of visibleCustomSections) {
    paragraphs.push(heading(section.title.trim() || "Section"));
    paragraphs.push(...experienceParagraphs(customSectionToExperience(section)));
  }

  return paragraphs;
}

export async function downloadResumeAsDocx(version: ResumeVersion): Promise<void> {
  const data = toResumeContent(version);
  const doc = new Document({
    sections: [{ children: buildDocxParagraphs(data) }],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, getExportFilename(version), "docx");
}
