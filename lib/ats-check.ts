/**
 * Free ATS check (no AI): renders the resume's plain-text layer — the same
 * content and order as the PDF/Word downloads — runs it back through the
 * resume parser used for imports, and reports what a parser extracted plus
 * concrete issues. A simulation of typical ATS parsing, not any one vendor.
 */
import type { ResumeVersion } from "./schema";
import { buildResumeText } from "./export-text";
import { parseResumeText } from "./import/parse-resume-text";
import type { ParsedResumeFields } from "./import/types";

export type AtsSeverity = "error" | "warning" | "tip";

/** Where a "Fix" button should take the user (editor section anchor). */
export type AtsTarget = "contact" | "summary" | "experience" | "skills" | "education" | "custom" | "design";

export type AtsIssue = {
  id: string;
  severity: AtsSeverity;
  title: string;
  detail: string;
  target: AtsTarget;
};

export type AtsField = {
  label: string;
  value: string;
  status: "ok" | "missing" | "different";
  /** What the resume actually says, when the parser read it differently. */
  expected?: string;
};

export type AtsJob = {
  title: string;
  company: string;
  dates: string;
  bullets: number;
  status: "ok" | "partial" | "missing";
};

export type AtsReport = {
  text: string;
  parsed: ParsedResumeFields;
  contact: AtsField[];
  jobs: AtsJob[];
  education: { school: string; degree: string; date: string }[];
  skills: string[];
  sectionsFound: string[];
  issues: AtsIssue[];
  checksRun: number;
  checksPassed: number;
};

const norm = (s: string | undefined) =>
  (s ?? "").toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/[^a-z0-9@.+]/g, "");

const STANDARD_CUSTOM_HEADINGS = new Set(
  [
    "projects", "project experience", "certifications", "certificates", "licenses", "licenses & certifications",
    "volunteering", "volunteer experience", "leadership", "awards", "honors", "honors & awards",
    "publications", "languages", "activities", "training", "courses", "research",
  ].map((h) => h.toLowerCase())
);

const MONTH_YEAR = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}$/i;
const YEAR_ONLY = /^\d{4}$/;
const NUMERIC = /^\d{1,2}\/\d{2,4}$/;

function dateStyle(value: string): string | null {
  const v = value.trim();
  if (!v || /^present$/i.test(v)) return null;
  if (MONTH_YEAR.test(v)) return "Mon YYYY";
  if (YEAR_ONLY.test(v)) return "YYYY";
  if (NUMERIC.test(v)) return "MM/YYYY";
  return "other";
}

export function runAtsCheck(version: ResumeVersion): AtsReport {
  const text = buildResumeText(version);
  const parsed = parseResumeText(text);
  const issues: AtsIssue[] = [];
  let checksRun = 0;
  let checksPassed = 0;
  const check = (passed: boolean, issue: Omit<AtsIssue, "id"> & { id: string }) => {
    checksRun++;
    if (passed) checksPassed++;
    else issues.push(issue);
  };

  // ── Contact ────────────────────────────────────────────────────────────
  const c = version.contact;
  const p = parsed.contact;
  const field = (label: string, source: string | undefined, got: string | undefined): AtsField => {
    if (!source?.trim()) return { label, value: got?.trim() ?? "", status: "missing" };
    if (!got?.trim()) return { label, value: "", status: "missing", expected: source.trim() };
    return norm(source) === norm(got) || norm(got).includes(norm(source)) || norm(source).includes(norm(got))
      ? { label, value: got.trim(), status: "ok" }
      : { label, value: got.trim(), status: "different", expected: source.trim() };
  };
  const contact: AtsField[] = [
    field("Name", c.fullName, p.fullName),
    field("Email", c.email, p.email),
    field("Phone", c.phone, p.phone),
    field("Location", c.location, p.location),
    field("LinkedIn", c.linkedIn, p.linkedIn),
  ];

  check(Boolean(c.fullName.trim()) && contact[0].status === "ok", {
    id: "name",
    severity: "error",
    title: c.fullName.trim() ? "Your name wasn't read correctly" : "Add your name",
    detail: "The name at the top is how an ATS creates your candidate profile.",
    target: "contact",
  });
  check(Boolean(c.email.trim()) && contact[1].status === "ok", {
    id: "email",
    severity: "error",
    title: c.email.trim() ? "Your email wasn't recognized" : "Add an email address",
    detail: "Without a readable email, recruiters can't contact you from the ATS.",
    target: "contact",
  });
  check(Boolean(c.phone.trim()), {
    id: "phone",
    severity: "warning",
    title: "Add a phone number",
    detail: "Most applicant profiles require one, and recruiters often call first.",
    target: "contact",
  });
  check(Boolean(c.location.trim()), {
    id: "location",
    severity: "warning",
    title: "Add your city and state",
    detail: "Many recruiters filter candidates by location. “Remote” is fine if that's what you want.",
    target: "contact",
  });

  // ── Experience ─────────────────────────────────────────────────────────
  const sourceJobs = version.experience.filter((j) => j.title.trim() || j.company.trim() || j.bullets.some((b) => b.trim()));
  const jobs: AtsJob[] = parsed.experience.map((j) => ({
    title: j.title,
    company: j.company,
    dates: [j.startDate, j.current ? "Present" : j.endDate].filter(Boolean).join(" – "),
    bullets: j.bullets.filter((b) => b.trim()).length,
    status: j.title.trim() && j.company.trim() && j.startDate.trim() ? "ok" : "partial",
  }));

  check(sourceJobs.length > 0, {
    id: "no-experience",
    severity: "error",
    title: "Add your work experience",
    detail: "An ATS ranks candidates mostly on job titles, employers, and dates.",
    target: "experience",
  });

  if (sourceJobs.length > 0) {
    check(parsed.experience.length >= sourceJobs.length, {
      id: "jobs-lost",
      severity: "error",
      title: `Only ${parsed.experience.length} of ${sourceJobs.length} jobs were picked up`,
      detail: "Each job needs a company and a job title so a parser can tell where one role ends and the next begins.",
      target: "experience",
    });

    const missingParts = sourceJobs.filter((j) => !j.title.trim() || !j.company.trim());
    check(missingParts.length === 0, {
      id: "job-fields",
      severity: "warning",
      title: `${missingParts.length} job${missingParts.length === 1 ? " is" : "s are"} missing a title or company`,
      detail: "Fill in both so the ATS can match you to roles by title.",
      target: "experience",
    });

    const missingDates = sourceJobs.filter((j) => !j.startDate.trim());
    check(missingDates.length === 0, {
      id: "job-dates",
      severity: "warning",
      title: `${missingDates.length} job${missingDates.length === 1 ? " has" : "s have"} no start date`,
      detail: "ATS systems calculate years of experience from your dates.",
      target: "experience",
    });

    const styles = new Set(
      sourceJobs.flatMap((j) => [dateStyle(j.startDate), j.current ? null : dateStyle(j.endDate)]).filter(Boolean)
    );
    check(styles.size <= 1 && !styles.has("other"), {
      id: "date-format",
      severity: "warning",
      title: "Use one date format everywhere",
      detail: `Your dates mix ${[...styles].join(", ")}. Pick one — “Jan 2022” is the safest.`,
      target: "experience",
    });

    const noBullets = sourceJobs.filter((j) => !j.bullets.some((b) => b.trim()));
    check(noBullets.length === 0, {
      id: "no-bullets",
      severity: "warning",
      title: `${noBullets.length} job${noBullets.length === 1 ? " has" : "s have"} no bullet points`,
      detail: "Keywords in your bullets are what most ATS searches match against.",
      target: "experience",
    });

    const longBullets = sourceJobs.flatMap((j) => j.bullets).filter((b) => b.trim().length > 240);
    check(longBullets.length === 0, {
      id: "long-bullets",
      severity: "tip",
      title: `${longBullets.length} bullet${longBullets.length === 1 ? " is" : "s are"} very long`,
      detail: "Keep bullets to one or two lines so both parsers and recruiters can scan them.",
      target: "experience",
    });
  }

  // ── Skills / Education / Summary ──────────────────────────────────────
  const skills = parsed.skillGroups
    .flatMap((g) => g.items.split(/[,;|]/))
    .map((s) => s.trim())
    .filter(Boolean);
  check(version.skillGroups.some((g) => g.items.trim()), {
    id: "skills",
    severity: "warning",
    title: "Add a Skills section",
    detail: "Recruiters search the ATS for specific skills — list the ones you have, in the posting's wording.",
    target: "skills",
  });

  const education = parsed.education.map((e) => ({
    school: e.institution,
    degree: e.details,
    date: e.graduationDate ?? "",
  }));
  check(version.education.some((e) => e.institution.trim() || e.details.trim()), {
    id: "education",
    severity: "tip",
    title: "Add your education",
    detail: "Many ATS forms have required education fields that are filled from your resume.",
    target: "education",
  });

  check(Boolean(version.summary.trim()), {
    id: "summary",
    severity: "tip",
    title: "Add a short summary",
    detail: "A 2–3 sentence summary with your target title helps both keyword search and the recruiter's first read.",
    target: "summary",
  });

  // ── Formatting ─────────────────────────────────────────────────────────
  const unusual = (version.customSections ?? [])
    .map((s) => s.title.trim())
    .filter((t) => t && !STANDARD_CUSTOM_HEADINGS.has(t.toLowerCase()));
  check(unusual.length === 0, {
    id: "headings",
    severity: "tip",
    title: `Unusual heading${unusual.length === 1 ? "" : "s"}: ${unusual.map((t) => `“${t}”`).join(", ")}`,
    detail: "ATS systems look for standard names like Projects, Certifications, or Volunteering.",
    target: "custom",
  });

  const emoji = text.match(/\p{Extended_Pictographic}/gu) ?? [];
  check(emoji.length === 0, {
    id: "emoji",
    severity: "warning",
    title: "Remove emoji and decorative symbols",
    detail: `Found ${[...new Set(emoji)].join(" ")} — parsers often turn these into garbage characters.`,
    target: "contact",
  });

  const sectionsFound = [
    parsed.summary && "Summary",
    parsed.experience.length && "Experience",
    ...parsed.customSections.map((s) => s.title),
    parsed.skillGroups.length && "Skills",
    parsed.education.length && "Education",
  ].filter(Boolean) as string[];

  const order: Record<AtsSeverity, number> = { error: 0, warning: 1, tip: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);

  return { text, parsed, contact, jobs, education, skills, sectionsFound, issues, checksRun, checksPassed };
}
