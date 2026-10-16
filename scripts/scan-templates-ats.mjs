import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = "/workspace";
const outDir = "/opt/cursor/artifacts/ats-audit/template-scan";
fs.mkdirSync(outDir, { recursive: true });

function renderPdf(version) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "scripts/render-pdf-worker.mjs")], {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_PATH: path.join(root, "node_modules") },
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (c) => stdout.push(c));
    child.stderr.on("data", (c) => stderr.push(c));
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(stdout))
        : reject(new Error(Buffer.concat(stderr).toString() || `exit ${code}`))
    );
    child.stdin.write(JSON.stringify(version));
    child.stdin.end();
  });
}

const jordan = {
  id: "scan",
  name: "Jordan Blake - Software Engineer",
  updatedAt: new Date().toISOString(),
  design: {
    fontFamily: "arial",
    fontSize: "medium",
    accentColor: "#1e5aa8",
    spacing: "comfortable",
  },
  sectionOrder: ["summary", "experience", "custom", "skills", "education"],
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
    "Software engineer with 7+ years building distributed backend services and React frontends.",
  experience: [
    {
      id: "e1",
      company: "Cascade Cloud",
      location: "Seattle, WA",
      title: "Senior Software Engineer",
      startDate: "Mar 2021",
      endDate: "",
      current: true,
      bullets: [
        "Led redesign of billing event pipeline serving 2.4M accounts; cut p95 processing latency by 38%.",
        "Built TypeScript/React admin console used by 60 support agents, reducing handle time by 22%.",
        "Mentored 4 engineers through design reviews and production incident retrospectives.",
      ],
    },
    {
      id: "e2",
      company: "North Harbor Digital",
      location: "Portland, OR",
      title: "Software Engineer",
      startDate: "Jun 2018",
      endDate: "Feb 2021",
      current: false,
      bullets: [
        "Delivered Node.js microservices processing 120k daily transactions with 99.95% availability.",
        "Introduced contract tests that reduced production regressions by 45%.",
      ],
    },
  ],
  skillGroups: [
    { id: "s1", category: "Languages", items: "TypeScript, JavaScript, Python, SQL" },
    { id: "s2", category: "Infrastructure", items: "AWS, Docker, Kubernetes, PostgreSQL" },
  ],
  education: [
    {
      id: "ed1",
      institution: "University of Washington",
      location: "Seattle, WA",
      details: "B.S. Computer Science",
      graduationDate: "June 2016",
    },
  ],
  customSections: [],
  jobDescription: { url: "", text: "" },
  aiRecommendations: [],
  aiMeta: {},
};

for (const templateId of [
  "classic",
  "modern",
  "professional",
  "executive",
  "structured",
  "accent",
]) {
  const version = { ...jordan, templateId, id: `scan-${templateId}` };
  const pdf = await renderPdf(version);
  const pdfPath = path.join(outDir, `${templateId}.pdf`);
  fs.writeFileSync(pdfPath, pdf);
  const info = execSync(`pdfinfo "${pdfPath}" | egrep 'Pages|Title'`).toString();
  const text = execSync(`pdftotext -layout "${pdfPath}" -`).toString();
  const headingLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        /^(SUMMARY|EXPERIENCE|SKILLS|EDUCATION|PROFESSIONAL|CORE|E D U)/.test(l) ||
        /E D U C/.test(l) ||
        /S U M M/.test(l)
    );
  console.log(`\n=== ${templateId} ===`);
  console.log(info.trim());
  console.log("Heading-like lines:", headingLines);
  if (/E\s+D\s+U\s+C\s+A\s+T\s+I\s+O\s+N/.test(text)) {
    console.log("FAIL: letter-spaced EDUCATION");
  }
  if (/S\s+U\s+M\s+M\s+A\s+R\s+Y/.test(text)) {
    console.log("FAIL: letter-spaced SUMMARY");
  }
  if (/E\s+X\s+P\s+E\s+R\s+I\s+E\s+N\s+C\s+E/.test(text)) {
    console.log("FAIL: letter-spaced EXPERIENCE");
  }
}
