/**
 * Generate mock resume PDFs via the real app PDF path (render-pdf-worker).
 * Usage: node scripts/generate-ats-audit-pdfs.mjs <output-dir> [label]
 * label is used in filenames, e.g. "before" or "after".
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(process.argv[2] || path.join(root, "artifacts/ats-audit"));
const label = process.argv[3] || "sample";

const DEFAULT_DESIGN = {
  fontFamily: "arial",
  fontSize: "medium",
  accentColor: "#1e5aa8",
  spacing: "comfortable",
};

const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "custom",
  "skills",
  "education",
];

function baseVersion(overrides) {
  const now = new Date().toISOString();
  return {
    id: overrides.id,
    name: overrides.name,
    updatedAt: now,
    templateId: overrides.templateId ?? "classic",
    design: { ...DEFAULT_DESIGN, ...(overrides.design ?? {}) },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
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
      headline: "Senior Software Engineer | Full-Stack Platform",
      email: "jordan.blake@example.com",
      phone: "+1 (555) 014-8821",
      location: "Seattle, WA",
      linkedIn: "linkedin.com/in/jordanblake-example",
      linkedInHyperlink: true,
    },
    summary:
      "Software engineer with 7+ years building distributed backend services and React frontends. Known for shipping reliable APIs, improving system latency, and mentoring engineers on design reviews and testing practices.",
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
          "Led redesign of billing event pipeline serving 2.4M accounts; cut p95 processing latency by 38% and eliminated recurring overnight backlogs.",
          "Built TypeScript/React admin console used by 60 support agents, reducing average ticket handle time by 22%.",
          "Owned on-call rotation improvements and runbooks that lowered Sev-1 mean time to recover from 94 to 41 minutes.",
          "Mentored 4 engineers through design reviews, CI quality gates, and production incident retrospectives.",
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
          "Delivered Node.js microservices for order fulfillment that processed 120k daily transactions with 99.95% availability.",
          "Introduced contract tests and staging canaries that reduced production regressions by 45% over two release cycles.",
          "Partnered with product and data teams to ship GraphQL APIs consumed by web and mobile clients.",
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
          "Implemented REST endpoints and PostgreSQL schemas for customer onboarding workflows used by 8 enterprise clients.",
          "Automated weekly reporting jobs in Python that saved ~10 hours of manual analyst work each month.",
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
        category: "Frameworks",
        items: "React, Node.js, Next.js, Express, GraphQL",
      },
      {
        id: "swe-sk-3",
        category: "Infrastructure",
        items: "AWS, Docker, Kubernetes, PostgreSQL, Redis, CI/CD",
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
  }),

  baseVersion({
    id: "mock-ba-samira-owens",
    name: "Samira Owens - Business Analyst",
    templateId: "modern",
    design: { fontFamily: "calibri", fontSize: "medium", spacing: "comfortable" },
    contact: {
      fullName: "Samira Owens",
      headline: "Sales Operations & Business Analyst",
      email: "samira.owens@example.com",
      phone: "+1 (555) 017-4490",
      location: "Chicago, IL",
      linkedIn: "linkedin.com/in/samiraowens-example",
      linkedInHyperlink: true,
    },
    summary:
      "Business analyst with 6 years in B2B SaaS sales operations. Partners with revenue leaders to forecast accurately, clean CRM data, and turn pipeline insights into actionable playbooks for account executives.",
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
          "Built Salesforce dashboards and weekly forecast models covering $48M ARR; improved forecast accuracy from 71% to 91% within three quarters.",
          "Led CRM hygiene program that reduced duplicate accounts by 34% and cut average opportunity stage age by 9 days.",
          "Designed territory realignment analysis for 85 AEs, increasing balanced quota coverage and reducing over/under-assigned regions by 28%.",
          "Partnered with RevOps and Finance to automate commission inputs, eliminating 12+ hours of manual spreadsheet work each month.",
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
          "Translated stakeholder requirements into user stories and acceptance criteria for a quoting tool adopted by 40 sales reps.",
          "Analyzed win/loss data across 1,200 opportunities and recommended pricing guardrails that lifted win rate 6 points in mid-market.",
          "Created SQL-backed pipeline reports for Monday executive reviews, replacing ad-hoc spreadsheet exports.",
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
          "Tracked weekly store and e-commerce KPIs for 22 locations; flagged underperforming SKUs that informed a 15% inventory reduction.",
          "Supported regional managers with Excel models for promo ROI and staffing scenarios during peak seasons.",
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
        items: "CRM Hygiene, Pipeline Management, Territory Planning, Quota Modeling",
      },
      {
        id: "ba-sk-3",
        category: "Collaboration",
        items: "Requirements Gathering, Stakeholder Management, Process Documentation",
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
  }),

  baseVersion({
    id: "mock-ops-marcus-chen",
    name: "Marcus Chen - Operations Manager",
    templateId: "executive",
    design: { fontFamily: "georgia", fontSize: "medium", spacing: "compact" },
    contact: {
      fullName: "Marcus Chen",
      headline: "Operations Manager | Supply Chain & Fulfillment",
      email: "marcus.chen@example.com",
      phone: "+1 (555) 019-3364",
      location: "Dallas, TX",
      linkedIn: "linkedin.com/in/marcuschen-example",
      linkedInHyperlink: true,
    },
    summary:
      "Operations manager with 9 years leading warehouse, logistics, and cross-functional process improvement. Delivers measurable gains in on-time fulfillment, cost per order, and team safety while scaling throughput.",
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
          "Direct a 70-person fulfillment team across two shifts processing 18k orders/day with 98.7% on-time ship rate.",
          "Cut cost per order 17% by redesigning pick paths, introducing zone batching, and renegotiating parcel contracts.",
          "Launched weekly KPI huddles and visual management boards that reduced same-day backlog incidents by 52%.",
          "Partnered with Safety and HR to lower recordable incidents 40% year over year while growing headcount 25%.",
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
          "Supervised inbound receiving and putaway for a 220k sq ft DC; improved dock-to-stock cycle time from 28 to 16 hours.",
          "Implemented slotting rules that raised picker productivity 21% without adding overtime spend.",
          "Coordinated cross-dock pilots with transportation that trimmed average outbound trailer dwell by 35 minutes.",
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
          "Scheduled carrier pickups and exception handling for 90+ daily routes serving North Texas retailers.",
          "Built Excel trackers for missed scans and damaged freight that accelerated root-cause follow-up with vendors.",
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
        category: "Leadership",
        items: "Team Coaching, Safety Programs, Cross-functional Coordination",
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
          new Error(
            Buffer.concat(stderr).toString("utf8") || `exit ${code}`
          )
        );
    });
    child.stdin.write(JSON.stringify(version));
    child.stdin.end();
  });
}

function slugFor(version) {
  return version.contact.fullName.toLowerCase().replace(/\s+/g, "-");
}

fs.mkdirSync(outDir, { recursive: true });

for (const version of candidates) {
  const slug = slugFor(version);
  const pdfPath = path.join(outDir, `${slug}-${label}.pdf`);
  process.stderr.write(`Rendering ${version.contact.fullName} (${version.templateId}) → ${pdfPath}\n`);
  const pdf = await renderPdf(version);
  fs.writeFileSync(pdfPath, pdf);
  process.stderr.write(`  wrote ${pdf.length} bytes\n`);
}

process.stderr.write(`Done. Output: ${outDir}\n`);
