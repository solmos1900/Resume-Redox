/**
 * Generates Gregor golden-file resumes for Phase 2 import acceptance.
 * Output: fixtures/import/*.pdf (2) + *.docx (1) — text-extractable, not image-only.
 *
 * Run: node scripts/generate-import-fixtures.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "fixtures", "import");

const JORDAN = {
  fileBase: "jordan-lee-pm",
  name: "Jordan Lee",
  headline: "Product Manager | B2B SaaS",
  contact: "jordan.lee@example.com  •  +1 (555) 201-4400  •  Seattle, WA  •  linkedin.com/in/jordanlee-example",
  summary:
    "Product manager with eight years shipping platform and growth products for B2B SaaS. Partners with engineering and design to deliver roadmap outcomes with clear metrics.",
  experience: [
    {
      company: "Cascade Analytics, Seattle, WA",
      title: "Senior Product Manager  |  Mar 2021 – Present",
      bullets: [
        "Own the integrations roadmap across three product lines; shipped partner API v2 used by 40+ enterprise accounts.",
        "Cut time-to-value for new workspaces by 28% through onboarding experiments and clearer activation instrumentation.",
        "Facilitate quarterly planning with engineering; maintain a transparent backlog and release notes for customers.",
      ],
    },
    {
      company: "Harbor Labs, Remote",
      title: "Product Manager  |  Jun 2018 – Feb 2021",
      bullets: [
        "Launched a self-serve analytics tier that grew paid conversions 19% year over year.",
        "Partnered with design on a redesign of the query builder; reduced support tickets related to filters by 35%.",
      ],
    },
  ],
  skills: [
    "Product: Roadmapping, Discovery, Experimentation, Stakeholder Management",
    "Tools: Jira, Amplitude, Figma, SQL",
  ],
  education: [
    {
      line: "University of Washington, Seattle, WA  |  Jun 2016",
      details: "B.A. Business Administration",
    },
  ],
};

const SAM = {
  fileBase: "sam-chen-swe",
  name: "Sam Chen",
  headline: "Software Engineer | Full-Stack",
  contact: "sam.chen@example.com  •  +1 (555) 014-8800  •  Denver, CO  •  linkedin.com/in/samchen-example",
  summary:
    "Full-stack engineer focused on reliable TypeScript services and React frontends. Comfortable owning features from design review through production observability.",
  experience: [
    {
      company: "Redwood Health, Denver, CO",
      title: "Software Engineer  |  Jan 2022 – Present",
      bullets: [
        "Built appointment scheduling APIs in Node.js serving 200k monthly bookings with p95 latency under 180ms.",
        "Led migration of legacy jQuery screens to React; improved Lighthouse accessibility score from 62 to 94.",
        "Introduced contract tests for critical patient-data endpoints; caught three breaking changes before release.",
      ],
    },
    {
      company: "Summit Robotics, Boulder, CO",
      title: "Junior Software Engineer  |  Jul 2019 – Dec 2021",
      bullets: [
        "Implemented firmware update tooling in Python used by field technicians across 12 warehouse sites.",
        "Automated CI packaging for robot services; reduced release prep from half a day to under an hour.",
      ],
    },
  ],
  skills: [
    "Languages: TypeScript, Python, SQL",
    "Stack: React, Next.js, Node.js, PostgreSQL",
  ],
  education: [
    {
      line: "Colorado State University, Fort Collins, CO  |  May 2019",
      details: "B.S. Computer Science",
    },
  ],
};

const MORGAN = {
  fileBase: "morgan-patel-tpm",
  name: "Morgan Patel",
  headline: "Technical Program Manager | Platform Delivery",
  contact: "morgan.patel@example.com  •  +1 (555) 903-1200  •  Chicago, IL  •  linkedin.com/in/morganpatel-example",
  summary:
    "Technical program manager with a background in software engineering. Runs cross-functional delivery for platform programs with clear risks, owners, and launch criteria.",
  experience: [
    {
      company: "Lakeside Cloud, Chicago, IL",
      title: "Technical Program Manager  |  Feb 2020 – Present",
      bullets: [
        "Coordinate a 6-team platform program covering identity, billing, and developer APIs; hit three consecutive quarterly launch windows.",
        "Stand up release governance: weekly risk review, dependency board, and go/no-go checklist adopted org-wide.",
        "Partner with security on SOC2 evidence collection for new services without slipping GA dates.",
      ],
    },
    {
      company: "Lakeside Cloud, Chicago, IL",
      title: "Software Engineer  |  Aug 2017 – Jan 2020",
      bullets: [
        "Built internal deployment dashboards that reduced incident triage time for on-call engineers.",
        "Owned a billing webhook service handling 1M events/day with idempotent processing.",
      ],
    },
  ],
  skills: [
    "Delivery: TPM, Agile/Scrum, Risk Management, Release Governance",
    "Engineering: Python, SQL, REST APIs",
  ],
  education: [
    {
      line: "University of Illinois, Urbana-Champaign, IL  |  May 2017",
      details: "B.S. Computer Engineering",
    },
  ],
};

function resumePlainText(r) {
  const lines = [
    r.name,
    r.headline,
    r.contact,
    "",
    "SUMMARY",
    r.summary,
    "",
    "EXPERIENCE",
  ];
  for (const job of r.experience) {
    lines.push(job.company);
    lines.push(job.title);
    for (const b of job.bullets) lines.push(`- ${b}`);
    lines.push("");
  }
  lines.push("SKILLS");
  for (const s of r.skills) lines.push(s);
  lines.push("");
  lines.push("EDUCATION");
  for (const e of r.education) {
    lines.push(e.line);
    lines.push(e.details);
  }
  lines.push("");
  return lines.join("\n");
}

async function writePdf(resume) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([612, 792]); // US Letter
  let y = 742;
  const margin = 50;
  const width = 612 - margin * 2;
  const size = 10;
  const leading = 14;

  const ensureSpace = (need = leading) => {
    if (y - need < 50) {
      page = pdf.addPage([612, 792]);
      y = 742;
    }
  };

  const drawWrapped = (text, { bold: isBold = false, gap = leading } = {}) => {
    const f = isBold ? bold : font;
    const words = text.split(/\s+/);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(next, size) > width) {
        ensureSpace();
        page.drawText(line, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
        y -= gap;
        line = word;
      } else {
        line = next;
      }
    }
    if (line) {
      ensureSpace();
      page.drawText(line, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= gap;
    }
  };

  drawWrapped(resume.name, { bold: true, gap: 16 });
  drawWrapped(resume.headline, { gap: 14 });
  drawWrapped(resume.contact, { gap: 18 });

  drawWrapped("SUMMARY", { bold: true, gap: 14 });
  drawWrapped(resume.summary, { gap: 18 });

  drawWrapped("EXPERIENCE", { bold: true, gap: 14 });
  for (const job of resume.experience) {
    drawWrapped(job.company, { bold: true, gap: 12 });
    drawWrapped(job.title, { gap: 12 });
    for (const b of job.bullets) {
      drawWrapped(`- ${b}`, { gap: 12 });
    }
    y -= 6;
  }

  drawWrapped("SKILLS", { bold: true, gap: 14 });
  for (const s of resume.skills) drawWrapped(s, { gap: 12 });
  y -= 6;

  drawWrapped("EDUCATION", { bold: true, gap: 14 });
  for (const e of resume.education) {
    drawWrapped(e.line, { bold: true, gap: 12 });
    drawWrapped(e.details, { gap: 12 });
  }

  const bytes = await pdf.save();
  const out = path.join(outDir, `${resume.fileBase}.pdf`);
  fs.writeFileSync(out, bytes);
  console.log("Wrote", out);
}

async function writeDocx(resume) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: resume.name, bold: true, size: 28 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: resume.headline, size: 20 })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: resume.contact, size: 18 })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "SUMMARY", bold: true })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: resume.summary, size: 20 })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "EXPERIENCE", bold: true })],
    }),
  ];

  for (const job of resume.experience) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [new TextRun({ text: job.company, bold: true, size: 20 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: job.title, size: 20 })],
      })
    );
    for (const b of job.bullets) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `- ${b}`, size: 20 })],
        })
      );
    }
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200 },
      children: [new TextRun({ text: "SKILLS", bold: true })],
    })
  );
  for (const s of resume.skills) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: s, size: 20 })] })
    );
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200 },
      children: [new TextRun({ text: "EDUCATION", bold: true })],
    })
  );
  for (const e of resume.education) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: e.line, bold: true, size: 20 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: e.details, size: 20 })],
      })
    );
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const out = path.join(outDir, `${resume.fileBase}.docx`);
  fs.writeFileSync(out, buffer);
  console.log("Wrote", out);
}

fs.mkdirSync(outDir, { recursive: true });

// Also drop plain-text mirrors for human inspection / parser unit checks
for (const r of [JORDAN, SAM, MORGAN]) {
  fs.writeFileSync(
    path.join(outDir, `${r.fileBase}.txt`),
    resumePlainText(r),
    "utf8"
  );
}

await writePdf(JORDAN);
await writePdf(SAM);
await writeDocx(MORGAN);
console.log("Golden fixtures ready in", outDir);
