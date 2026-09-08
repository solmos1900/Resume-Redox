import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ResumeVersion, Contact, Experience } from "./schema";
import { toResumeContent } from "./templates/types";
import { getExportBlocks, formatExportDateRange } from "./export/export-blocks";
import { getExportFilename } from "./export";
import { downloadBlob } from "./download-history";
import { hasContactLineInfo, normalizeLinkedInUrl } from "./contact-url";

const HEADING_SPACING = { before: 240, after: 80 };
const BODY_SPACING = { after: 100 };

/**
 * DOCX is the ATS / plain-text sibling of the visual templates — same
 * content and section order as preview/PDF, not a pixel twin of Accent/etc.
 */
function contactLineRuns(
  contact: Contact,
  size: number
): (TextRun | ExternalHyperlink)[] {
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

    const dateRange = formatExportDateRange(
      job.startDate,
      job.endDate,
      job.current
    );
    if (job.title.trim() || dateRange) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            ...(job.title.trim()
              ? [new TextRun({ text: job.title, italics: true })]
              : []),
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

function buildDocxParagraphs(version: ResumeVersion): Paragraph[] {
  const data = toResumeContent(version);
  const blocks = getExportBlocks(data);

  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: data.contact.fullName || "Untitled",
          bold: true,
          size: 32,
        }),
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

  for (const block of blocks) {
    paragraphs.push(heading(block.title));
    if (block.kind === "summary") {
      paragraphs.push(
        new Paragraph({
          spacing: BODY_SPACING,
          children: [new TextRun({ text: block.body })],
        })
      );
    } else if (block.kind === "experience" || block.kind === "custom") {
      paragraphs.push(...experienceParagraphs(block.jobs));
    } else if (block.kind === "skills") {
      for (const group of block.groups) {
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
    } else if (block.kind === "education") {
      for (const edu of block.entries) {
        if (!edu.institution.trim() && !edu.details.trim()) continue;
        const line = [edu.institution, edu.location]
          .filter((s) => s.trim())
          .join(", ");
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
            new Paragraph({
              spacing: BODY_SPACING,
              children: [new TextRun({ text: edu.details })],
            })
          );
        }
      }
    }
  }

  return paragraphs;
}

export async function downloadResumeAsDocx(version: ResumeVersion): Promise<void> {
  const doc = new Document({
    sections: [{ children: buildDocxParagraphs(version) }],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, getExportFilename(version), "docx");
}
