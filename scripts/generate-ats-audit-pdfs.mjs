/**
 * Generate mock resume PDFs via the real app PDF path (render-pdf-worker).
 * Usage: node scripts/generate-ats-audit-pdfs.mjs <output-dir> [label] [slug?]
 *
 * Labels:
 *   v6              — v5 + Executive Summary separation, Company • City ST, certs one-line
 *   v5              — pipe contact + Title Case (app defaults); Ladders-safe headings
 *   v4              — pipe contact + Title Case (Jordan forced ALL CAPS control)
 *   v4-alt-labeled  — stacked labeled contact + Title Case
 *   v4-titlecase    — pipe contact + Title Case (explicit; same as app defaults)
 *   v4-upper        — pipe contact + ALL CAPS headings
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(process.argv[2] || path.join(root, "artifacts/ats-audit"));
const label = process.argv[3] || "sample";
const onlySlug = process.argv[4];

const DEFAULT_DESIGN = {
  fontFamily: "arial",
  fontSize: "medium",
  accentColor: "#1e5aa8",
  spacing: "compact",
};

const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "custom",
  "skills",
  "education",
];

function atsOptionsForLabel(labelName) {
  if (labelName.includes("alt-labeled") || labelName.includes("labeled")) {
    return {
      atsContactLayout: "stacked",
      atsSummaryHeading: "summary",
      atsHeadingCase: "title",
    };
  }
  if (labelName.includes("upper") || labelName.includes("allcaps")) {
    return {
      atsContactLayout: "inline",
      atsSummaryHeading: "summary",
      atsHeadingCase: "upper",
    };
  }
  // v6 / v5 / v4 / v4-titlecase / default
  return {
    atsContactLayout: "inline",
    atsSummaryHeading: "summary",
    atsHeadingCase: "title",
  };
}

function baseVersion(overrides) {
  const now = new Date().toISOString();
  const ats = atsOptionsForLabel(label);
  return {
    id: overrides.id,
    name: overrides.name,
    updatedAt: now,
    templateId: overrides.templateId ?? "classic",
    design: { ...DEFAULT_DESIGN, ...(overrides.design ?? {}) },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    atsContactLayout: overrides.atsContactLayout ?? ats.atsContactLayout,
    atsSummaryHeading: overrides.atsSummaryHeading ?? ats.atsSummaryHeading,
    atsHeadingCase: overrides.atsHeadingCase ?? ats.atsHeadingCase,
    contact: overrides.contact,
    summary: overrides.summary,
    experience: overrides.experience,
    skillGroups: overrides.skillGroups,
    education: overrides.education,
    customSections: overrides.customSections ?? [],
    jobDescription: { url: "", text: "" },
    aiRecommendations: [],
    aiMeta: {},
  };
}

const candidates = [
  baseVersion({
    id: "mock-swe-jordan-blake",
    name: "Jordan Blake - Software Engineer",
    templateId: "classic",
    contact: {
      fullName: "Jordan Blake",
      headline: "Senior Software Engineer | 7+ years | Full-Stack Platform",
      email: "jordan.blake@example.com",
      phone: "(555) 234-0100",
      location: "Seattle, WA",
      linkedIn: "https://www.linkedin.com/in/jordanblake-example",
      website: "https://github.com/jordanblake-example",
      linkedInHyperlink: true,
    },
    summary:
      "Senior Software Engineer with 7+ years in distributed backends and React. Targets platform/full-stack roles; cuts latency, hardens releases, and mentors engineers.",
    experience: [
      {
        id: "swe-exp-1",
        company: "Cascade Cloud",
        location: "Seattle, WA",
        title: "Senior Software Engineer",
        startDate: "Mar 2021",
        endDate: "",
        current: true,
        bullets: [
          "Cut p95 billing-pipeline latency 38% for 2.4M accounts by redesigning event processing.",
          "Shipped a TypeScript/React admin console used by 60 agents, cutting handle time 22%.",
          "Lowered Sev-1 MTTR from 94 to 41 minutes by rewriting on-call runbooks and routing.",
          "Coached 4 engineers through design reviews, CI gates, and incident retrospectives.",
        ],
      },
      {
        id: "swe-exp-2",
        company: "North Harbor Digital",
        location: "Portland, OR",
        title: "Software Engineer",
        startDate: "Jun 2018",
        endDate: "Feb 2021",
        current: false,
        bullets: [
          "Scaled Node.js fulfillment services to 120k daily transactions at 99.95% availability.",
          "Reduced production regressions 45% by adding contract tests and staging canaries.",
          "Delivered GraphQL and REST APIs that unblocked web and mobile client launches.",
        ],
      },
      {
        id: "swe-exp-3",
        company: "Brightline Labs",
        location: "Remote",
        title: "Junior Software Engineer",
        startDate: "Aug 2016",
        endDate: "May 2018",
        current: false,
        bullets: [
          "Accelerated onboarding for 8 enterprise clients with REST endpoints and PostgreSQL schemas.",
          "Saved 10 analyst hours/month by automating weekly reporting jobs in Python.",
        ],
      },
    ],
    skillGroups: [
      {
        id: "swe-sk-1",
        category: "Languages",
        items: "TypeScript, JavaScript, Python, SQL, Go",
      },
      {
        id: "swe-sk-2",
        category: "Frameworks & APIs",
        items: "React, Node.js, Next.js, Express, GraphQL, REST APIs, MongoDB",
      },
      {
        id: "swe-sk-3",
        category: "Infrastructure",
        items: "AWS, Docker, Kubernetes, PostgreSQL, Redis, CI/CD, Agile/Scrum",
      },
      {
        id: "swe-sk-4",
        category: "Soft Skills",
        items: "Technical Communication, Mentoring, Cross-functional Collaboration",
      },
    ],
    education: [
      {
        id: "swe-edu-1",
        institution: "University of Washington",
        location: "Seattle, WA",
        details: "B.S. Computer Science",
        graduationDate: "June 2016",
      },
    ],
    customSections: [
      {
        id: "swe-certs",
        title: "Certifications",
        entries: [
          {
            id: "swe-cert-1",
            name: "AWS Certified Developer – Associate",
            location: "",
            subtitle: "Amazon Web Services",
            startDate: "",
            endDate: "2023",
            current: false,
            bullets: ["Credential ID AWS-DEV-DEMO-1001"],
          },
        ],
      },
    ],
  }),

  baseVersion({
    id: "mock-ba-samira-owens",
    name: "Samira Owens - Business Analyst",
    templateId: "modern",
    design: {
      fontFamily: "calibri",
      fontSize: "medium",
      spacing: "compact",
    },
    contact: {
      fullName: "Samira Owens",
      headline: "Senior Business Analyst | 6+ years | Sales Operations",
      email: "samira.owens@example.com",
      phone: "(555) 347-0199",
      location: "Chicago, IL",
      linkedIn: "https://www.linkedin.com/in/samiraowens-example",
      website: "https://github.com/samiraowens-example",
      linkedInHyperlink: true,
    },
    summary:
      "Senior Business Analyst with 6+ years in B2B SaaS sales operations. Targets senior BA/sales-ops roles; raises forecast accuracy and CRM quality so revenue teams hit quota.",
    experience: [
      {
        id: "ba-exp-1",
        company: "Horizon SaaS Co.",
        location: "Chicago, IL",
        title: "Senior Business Analyst, Sales Operations",
        startDate: "Jan 2022",
        endDate: "",
        current: true,
        bullets: [
          "Raised forecast accuracy from 71% to 91% in 3 quarters for $48M ARR Salesforce models.",
          "Eliminated 34% of duplicate accounts and cut opportunity stage age by 9 days.",
          "Rebalanced territories for 85 AEs, reducing over/under-assigned regions 28%.",
          "Removed 12 hours/month of spreadsheet work by automating commission inputs.",
        ],
      },
      {
        id: "ba-exp-2",
        company: "Lakeview Analytics",
        location: "Chicago, IL",
        title: "Business Analyst",
        startDate: "Mar 2019",
        endDate: "Dec 2021",
        current: false,
        bullets: [
          "Drove quoting-tool adoption by 40 sales reps with clear user stories and criteria.",
          "Lifted mid-market win rate 6 points after analyzing 1,200 win/loss opportunities.",
          "Replaced ad-hoc spreadsheet exports with SQL reports for Monday executive reviews.",
        ],
      },
      {
        id: "ba-exp-3",
        company: "Prairie Retail Group",
        location: "Naperville, IL",
        title: "Sales Analyst",
        startDate: "Jul 2017",
        endDate: "Feb 2019",
        current: false,
        bullets: [
          "Informed a 15% inventory cut by flagging underperforming SKUs across 22 locations.",
          "Improved peak-season promo ROI with Excel models used by regional managers.",
        ],
      },
    ],
    skillGroups: [
      {
        id: "ba-sk-1",
        category: "Analytics",
        items: "SQL, Excel, Tableau, Salesforce Reports, Forecasting",
      },
      {
        id: "ba-sk-2",
        category: "Sales Operations",
        items: "CRM Hygiene, Pipeline Management, Territory Planning, Quota Modeling, Agile",
      },
      {
        id: "ba-sk-3",
        category: "Soft Skills",
        items: "Stakeholder Communication, Requirements Gathering, Process Documentation",
      },
    ],
    education: [
      {
        id: "ba-edu-1",
        institution: "University of Illinois Chicago",
        location: "Chicago, IL",
        details: "B.S. Business Administration, Concentration in Analytics",
        graduationDate: "May 2017",
      },
    ],
    customSections: [
      {
        id: "ba-certs",
        title: "Certifications",
        entries: [
          {
            id: "ba-cert-1",
            name: "Salesforce Certified Administrator",
            location: "",
            subtitle: "Salesforce",
            startDate: "",
            endDate: "2022",
            current: false,
            bullets: ["Credential ID SF-ADM-DEMO-2204"],
          },
        ],
      },
    ],
  }),

  baseVersion({
    id: "mock-ops-marcus-chen",
    name: "Marcus Chen - Operations Manager",
    templateId: "executive",
    design: {
      fontFamily: "georgia",
      fontSize: "medium",
      // compact (not tight): AutoApplyMax Readability + TheLadders phone/date extract
      spacing: "compact",
    },
    contact: {
      fullName: "Marcus Chen",
      headline: "Operations Manager | 9+ years | Supply Chain & Fulfillment",
      email: "marcus.chen@example.com",
      phone: "(555) 268-0142",
      location: "Dallas, TX",
      linkedIn: "https://www.linkedin.com/in/marcuschen-example",
      website: "https://github.com/marcuschen-example",
      linkedInHyperlink: true,
    },
    summary:
      "Operations Manager with 9+ years scaling warehouse and logistics teams. Targets operations leadership; improves on-time ship rate, cost per order, and safety.",
    experience: [
      {
        id: "ops-exp-1",
        company: "Redwood Fulfillment",
        location: "Dallas, TX",
        title: "Operations Manager",
        startDate: "Apr 2020",
        endDate: "",
        current: true,
        bullets: [
          "Grew a 70-person fulfillment team to 18k orders/day at a 98.7% on-time ship rate.",
          "Cut cost per order 17% via pick-path redesign, zone batching, and parcel renegotiation.",
          "Slashed same-day backlog incidents 52% with weekly KPI huddles and visual boards.",
          "Reduced recordable incidents 40% YoY while expanding headcount 25%.",
        ],
      },
      {
        id: "ops-exp-2",
        company: "Summit Consumer Goods",
        location: "Fort Worth, TX",
        title: "Operations Supervisor",
        startDate: "Aug 2016",
        endDate: "Mar 2020",
        current: false,
        bullets: [
          "Shortened dock-to-stock cycle time from 28 to 16 hours in a 220k sq ft DC.",
          "Raised picker productivity 21% without overtime by implementing new slotting rules.",
          "Trimmed outbound trailer dwell 35 minutes through cross-dock pilots with carriers.",
        ],
      },
      {
        id: "ops-exp-3",
        company: "Metro Parcel Hub",
        location: "Arlington, TX",
        title: "Logistics Coordinator",
        startDate: "Jun 2014",
        endDate: "Jul 2016",
        current: false,
        bullets: [
          "Stabilized 90+ daily North Texas routes by tightening pickup schedules and exceptions.",
          "Accelerated vendor follow-up with trackers for missed scans and damaged freight.",
        ],
      },
    ],
    skillGroups: [
      {
        id: "ops-sk-1",
        category: "Operations",
        items: "Warehouse Management, Process Improvement, Labor Planning, KPI Management",
      },
      {
        id: "ops-sk-2",
        category: "Systems",
        items: "WMS, Excel, Inventory Controls, Continuous Improvement (Lean)",
      },
      {
        id: "ops-sk-3",
        category: "Soft Skills",
        items: "Cross-functional Communication, Team Coaching, Safety Programs",
      },
    ],
    education: [
      {
        id: "ops-edu-1",
        institution: "Texas State University",
        location: "San Marcos, TX",
        details: "B.B.A. Supply Chain Management",
        graduationDate: "May 2014",
      },
    ],
    customSections: [
      {
        id: "ops-certs",
        title: "Certifications",
        entries: [
          {
            id: "ops-cert-1",
            name: "Certified in Logistics, Transportation and Distribution (CLTD)",
            location: "",
            subtitle: "APICS / ASCM",
            startDate: "",
            endDate: "2021",
            current: false,
            bullets: ["Credential ID CLTD-DEMO-2144"],
          },
        ],
      },
    ],
  }),
];

function renderPdf(version) {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(root, "scripts/render-pdf-worker.mjs");
    const child = spawn(process.execPath, [workerPath], {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_PATH: path.join(root, "node_modules"),
      },
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (c) => stdout.push(c));
    child.stderr.on("data", (c) => stderr.push(c));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(stdout));
      else
        reject(
          new Error(Buffer.concat(stderr).toString("utf8") || `exit ${code}`)
        );
    });
    child.stdin.write(JSON.stringify(version));
    child.stdin.end();
  });
}

function slugFor(version) {
  return version.contact.fullName.toLowerCase().replace(/\s+/g, "-");
}

function fileNameFor(slug, labelName) {
  // Match requested artifact names
  if (labelName === "v4-alt-labeled" && slug === "jordan-blake") {
    return "jordan-v4-alt-labeled.pdf";
  }
  if (labelName === "v4-titlecase" && slug === "jordan-blake") {
    return "jordan-v4-titlecase.pdf";
  }
  return `${slug}-${labelName}.pdf`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const version of candidates) {
  const slug = slugFor(version);
  if (onlySlug && slug !== onlySlug && onlySlug !== "jordan-blake") continue;
  if (onlySlug === "jordan-blake" && slug !== "jordan-blake") continue;

  // jordan-blake-v4 only = ALL CAPS control; v5+ and jordan-v4-titlecase = Title Case.
  const rendered =
    label === "v4" && slug === "jordan-blake"
      ? { ...version, atsHeadingCase: "upper" }
      : version;

  const pdfPath = path.join(outDir, fileNameFor(slug, label));
  process.stderr.write(
    `Rendering ${rendered.contact.fullName} (${rendered.templateId}, ${rendered.atsContactLayout}, ${rendered.atsHeadingCase}) → ${pdfPath}\n`
  );
  const pdf = await renderPdf(rendered);
  fs.writeFileSync(pdfPath, pdf);
  process.stderr.write(`  wrote ${pdf.length} bytes\n`);
}

process.stderr.write(`Done. Output: ${outDir}\n`);
