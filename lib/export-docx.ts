import {
  AlignmentType,
  Document,
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
import {
  formatLinkedInDisplay,
  formatWebsiteDisplay,
  hasContactLineInfo,
} from "./contact-url";
import { formatAtsPhone, formatCompanyLocation } from "./utils";

const HEADING_SPACING = { before: 240, after: 80 };
const BODY_SPACING = { after: 100 };

/**
 * DOCX is the ATS / plain-text sibling of the visual templates — same
 * content and section order as preview/PDF, not a pixel twin of Accent/etc.
 */
function contactPrimaryValues(contact: Contact): string[] {
  const values: string[] = [];
  if (contact.phone?.trim()) values.push(formatAtsPhone(contact.phone));
  if (contact.email?.trim()) values.push(contact.email.trim());
  if (contact.location?.trim()) values.push(contact.location.trim());
  return values;
}

function contactUrlValues(contact: Contact): string[] {
  const values: string[] = [];
  if (contact.linkedIn?.trim()) {
    values.push(formatLinkedInDisplay(contact.linkedIn));
  }
  if (contact.website?.trim()) {
    values.push(formatWebsiteDisplay(contact.website));
  }
  return values;
}

function contactLabeledLines(contact: Contact): string[] {
  const lines: string[] = [];
  if (contact.phone?.trim()) {
    lines.push(`Phone: ${formatAtsPhone(contact.phone)}`);
  }
  if (contact.email?.trim()) lines.push(`Email: ${contact.email.trim()}`);
  if (contact.location?.trim()) {
    lines.push(`Location: ${contact.location.trim()}`);
  }
  if (contact.linkedIn?.trim()) {
    lines.push(`LinkedIn: ${formatLinkedInDisplay(contact.linkedIn)}`);
  }
  if (contact.website?.trim()) {
    lines.push(`Website: ${formatWebsiteDisplay(contact.website)}`);
  }
  return lines;
}

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: HEADING_SPACING,
    // Keep the casing chosen by getExportBlocks (Title Case or ALL CAPS).
    children: [new TextRun({ text, bold: true })],
  });
}

function experienceParagraphs(jobs: Experience[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const job of jobs) {
    const companyLine = formatCompanyLocation(job.company, job.location);
    const bullets = job.bullets.filter((b) => b.trim());
    if (!companyLine && !job.title.trim() && bullets.length === 0) continue;

    const dateRange = formatExportDateRange(
      job.startDate,
      job.endDate,
      job.current
    );

    // Company + dates on one line (matches PDF ATS layout)
    if (companyLine || dateRange) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 160, after: 20 },
          children: [
            ...(companyLine
              ? [new TextRun({ text: companyLine, bold: true })]
              : []),
            ...(dateRange
              ? [new TextRun({ text: `\t${dateRange}` })]
              : []),
          ],
        })
      );
    }

    if (job.title.trim()) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: job.title, italics: true })],
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
  const stacked = data.atsContactLayout !== "inline";

  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
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
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [new TextRun({ text: data.contact.headline, italics: true })],
      })
    );
  }

  if (hasContactLineInfo(data.contact)) {
    if (stacked) {
      const lines = contactLabeledLines(data.contact);
      lines.forEach((line, index) => {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: index === lines.length - 1 ? 200 : 20 },
            children: [new TextRun({ text: line, size: 20 })],
          })
        );
      });
    } else {
      const primary = contactPrimaryValues(data.contact).join(" | ");
      const urls = contactUrlValues(data.contact).join(" | ");
      if (primary) {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: urls ? 20 : 200 },
            children: [new TextRun({ text: primary, size: 20 })],
          })
        );
      }
      if (urls) {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
            children: [new TextRun({ text: urls, size: 20 })],
          })
        );
      }
    }
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
              new TextRun({
                text: group.category.trim()
                  ? `${group.category}: ${group.items}`
                  : group.items,
              }),
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
            spacing: { before: 80, after: 20 },
            children: [
              new TextRun({ text: line, bold: true }),
              ...(edu.graduationDate.trim()
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
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: buildDocxParagraphs(version),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, getExportFilename(version), "docx");
}
