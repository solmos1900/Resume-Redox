/**
 * Generate mock resume PDFs via the real app PDF path (render-pdf-worker).
 * Usage: node scripts/generate-ats-audit-pdfs.mjs <output-dir> [label]
 * label is used in filenames, e.g. "before", "after", or "v2".
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
      // Valid NANP shape (555-01xx fictional subscriber range)
      phone: "(555) 234-0100",
      location: "Seattle, WA",
      linkedIn: "linkedin.com/in/jordanblake-example",
      linkedInHyperlink: true,
    },
    summary:
      "Software engineer with 7+ years shipping distributed backend services and React frontends. Cuts latency, hardens releases, and mentors engineers through design reviews and production readiness.",
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
          "Cut p95 billing-pipeline latency 38% for 2.4M accounts by redesigning event processing and eliminating overnight backlogs.",
          "Shipped a TypeScript/React admin console adopted by 60 support agents, reducing average ticket handle time 22%.",
          "Lowered Sev-1 mean time to recover from 94 to 41 minutes by rewriting on-call runbooks and alert routing.",
          "Coached 4 engineers through design reviews, CI quality gates, and production incident retrospectives.",
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
          "Reduced production regressions 45% over two release cycles by adding contract tests and staging canaries.",
          "Unblocked web and mobile clients by delivering GraphQL APIs with product and data partners.",
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
          "Accelerated onboarding for 8 enterprise clients by implementing REST endpoints and PostgreSQL schemas.",
          "Saved ~10 analyst hours per month by automating weekly reporting jobs in Python.",
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
      phone: "(555) 347-0199",
      location: "Chicago, IL",
      linkedIn: "linkedin.com/in/samiraowens-example",
      linkedInHyperlink: true,
    },
    summary:
      "Business analyst with 6 years in B2B SaaS sales operations. Improves forecast accuracy, CRM data quality, and pipeline decisions so revenue teams hit quota with clearer playbooks.",
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
          "Raised forecast accuracy from 71% to 91% in three quarters by rebuilding Salesforce dashboards for $48M ARR.",
          "Eliminated 34% of duplicate accounts and shortened average opportunity stage age by 9 days through a CRM hygiene program.",
          "Rebalanced territories for 85 AEs, cutting over/under-assigned regions 28% and improving quota coverage.",
          "Removed 12+ hours of monthly spreadsheet work by automating commission inputs with RevOps and Finance.",
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
          "Drove adoption of a quoting tool by 40 sales reps after converting stakeholder needs into clear user stories and acceptance criteria.",
          "Lifted mid-market win rate 6 points by analyzing 1,200 win/loss opportunities and installing pricing guardrails.",
          "Replaced ad-hoc spreadsheet exports with SQL pipeline reports used in Monday executive reviews.",
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
          "Informed a 15% inventory reduction by surfacing underperforming SKUs across 22 store and e-commerce locations.",
          "Improved peak-season promo ROI decisions with Excel models used by regional managers for staffing scenarios.",
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
      phone: "(555) 268-0142",
      location: "Dallas, TX",
      linkedIn: "linkedin.com/in/marcuschen-example",
      linkedInHyperlink: true,
    },
    summary:
      "Operations manager with 9 years scaling warehouse and logistics teams. Improves on-time fulfillment, cost per order, and safety while growing throughput.",
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
          "Grew a 70-person, two-shift fulfillment team to 18k orders/day at a 98.7% on-time ship rate.",
          "Cut cost per order 17% by redesigning pick paths, introducing zone batching, and renegotiating parcel contracts.",
          "Slashed same-day backlog incidents 52% after launching weekly KPI huddles and visual management boards.",
          "Reduced recordable incidents 40% year over year while expanding headcount 25%, partnering with Safety and HR.",
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
          "Shortened dock-to-stock cycle time from 28 to 16 hours across a 220k sq ft DC inbound operation.",
          "Raised picker productivity 21% without overtime by implementing new slotting rules.",
          "Trimmed average outbound trailer dwell 35 minutes through cross-dock pilots with transportation.",
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
          "Stabilized 90+ daily North Texas routes by tightening carrier pickup schedules and exception handling.",
          "Accelerated vendor root-cause follow-up with Excel trackers for missed scans and damaged freight.",
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
