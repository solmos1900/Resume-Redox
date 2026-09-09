import type {
  Contact,
  CustomSection,
  CustomSectionEntry,
  Education,
  Experience,
  SkillGroup,
} from "@/lib/schema";
import { generateId } from "@/lib/utils";
import type { ParsedResumeFields } from "./types";

const SECTION_ALIASES: Record<string, string> = {
  summary: "summary",
  "professional summary": "summary",
  "profile": "summary",
  "about": "summary",
  "about me": "summary",
  experience: "experience",
  "work experience": "experience",
  "professional experience": "experience",
  employment: "experience",
  "work history": "experience",
  education: "education",
  "academic background": "education",
  skills: "skills",
  "technical skills": "skills",
  "core skills": "skills",
  "skills & tools": "skills",
  projects: "custom:Projects",
  project: "custom:Projects",
  leadership: "custom:Leadership",
  certifications: "custom:Certifications",
  awards: "custom:Awards",
  volunteering: "custom:Volunteering",
  volunteer: "custom:Volunteering",
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;
const LINKEDIN_RE =
  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i;
const MONTH_YEAR_RE =
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}$/i;
const BULLET_RE = /^[-•●▪◦*]\s+(.+)$/;

type SectionKind =
  | { type: "summary" }
  | { type: "experience" }
  | { type: "education" }
  | { type: "skills" }
  | { type: "custom"; title: string };

type SectionBlock = { kind: SectionKind; lines: string[] };

function normalizeHeading(line: string): string {
  return line
    .trim()
    .replace(/[:：]\s*$/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function matchSection(line: string): SectionKind | null {
  const key = normalizeHeading(line);
  // All-caps short headings or Title Case known aliases
  const alias = SECTION_ALIASES[key];
  if (!alias) {
    // Accept ALL CAPS unknown headings as custom sections when short
    const trimmed = line.trim();
    if (
      trimmed.length >= 3 &&
      trimmed.length <= 40 &&
      /^[A-Z0-9][A-Z0-9 &/'-]+$/.test(trimmed) &&
      !EMAIL_RE.test(trimmed) &&
      !PHONE_RE.test(trimmed)
    ) {
      // Avoid treating a person's name (first line style) — handled by caller order
      const titleCase = trimmed
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { type: "custom", title: titleCase };
    }
    return null;
  }
  if (alias === "summary") return { type: "summary" };
  if (alias === "experience") return { type: "experience" };
  if (alias === "education") return { type: "education" };
  if (alias === "skills") return { type: "skills" };
  if (alias.startsWith("custom:")) {
    return { type: "custom", title: alias.slice("custom:".length) };
  }
  return null;
}

function isLikelySectionHeading(line: string, index: number): boolean {
  if (index === 0) return false;
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 48) return false;
  if (EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed)) return false;
  if (BULLET_RE.test(trimmed)) return false;
  const key = normalizeHeading(trimmed);
  if (SECTION_ALIASES[key]) return true;
  // ALL CAPS headings
  if (/^[A-Z][A-Z0-9 &/'-]{2,}$/.test(trimmed) && !/[a-z]/.test(trimmed)) {
    return true;
  }
  return false;
}

function splitSections(lines: string[]): {
  preamble: string[];
  sections: SectionBlock[];
} {
  const preamble: string[] = [];
  const sections: SectionBlock[] = [];
  let current: SectionBlock | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isLikelySectionHeading(line, i)) {
      const kind = matchSection(line);
      if (kind) {
        current = { kind, lines: [] };
        sections.push(current);
        continue;
      }
    }
    if (current) current.lines.push(line);
    else preamble.push(line);
  }

  return { preamble, sections };
}

function parseContactFromPreamble(preamble: string[]): Contact {
  const nonEmpty = preamble.map((l) => l.trim()).filter(Boolean);
  const contact: Contact = {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    linkedIn: "",
    linkedInHyperlink: true,
  };

  if (nonEmpty.length === 0) return contact;

  contact.fullName = nonEmpty[0];

  const blob = nonEmpty.join("\n");
  const email = blob.match(EMAIL_RE)?.[0];
  const phone = blob.match(PHONE_RE)?.[0];
  const linkedIn = blob.match(LINKEDIN_RE)?.[0];
  if (email) contact.email = email;
  if (phone) contact.phone = phone;
  if (linkedIn) {
    contact.linkedIn = linkedIn.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }

  // Headline: second line if it doesn't look like contact metadata
  if (nonEmpty.length > 1) {
    const second = nonEmpty[1];
    const isContactish =
      EMAIL_RE.test(second) ||
      PHONE_RE.test(second) ||
      LINKEDIN_RE.test(second) ||
      (second.split(/\s*[|•·]\s*/).filter(Boolean).length >= 3 &&
        (EMAIL_RE.test(second) ||
          PHONE_RE.test(second) ||
          LINKEDIN_RE.test(second) ||
          /\d{3}/.test(second)));
    if (!isContactish && second.length < 120) {
      contact.headline = second;
    }
  }

  // Location: from a contact line with separators, or a lone "City, ST"
  for (const line of nonEmpty.slice(1)) {
    const parts = line
      .split(/\s*[|•·]\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      if (EMAIL_RE.test(part) || PHONE_RE.test(part) || LINKEDIN_RE.test(part)) {
        continue;
      }
      if (/^[A-Za-z .'-]+,\s*[A-Z]{2}$/.test(part) || /^[A-Za-z .'-]+,\s*[A-Za-z .'-]+$/.test(part)) {
        if (!contact.location) contact.location = part;
      }
    }
  }

  return contact;
}

function parseDateRange(raw: string): {
  startDate: string;
  endDate: string;
  current: boolean;
} {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const present = /present|current/i.test(cleaned);
  const parts = cleaned
    .split(/\s*[–—-]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      startDate: parts[0],
      endDate: present ? "" : parts[1],
      current: present,
    };
  }
  if (parts.length === 1 && present) {
    return { startDate: "", endDate: "", current: true };
  }
  if (parts.length === 1 && MONTH_YEAR_RE.test(parts[0])) {
    return { startDate: parts[0], endDate: "", current: false };
  }
  return { startDate: cleaned, endDate: "", current: present };
}

function looksLikeJobHeader(line: string): boolean {
  if (BULLET_RE.test(line)) return false;
  // "Company, City, ST" or "Company, Remote"
  if (/^[A-Z0-9].+,\s*[A-Za-z]/.test(line) && !EMAIL_RE.test(line)) return true;
  // "Title  |  Jan 2021 – Present"
  if (/\|\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(line)) {
    return true;
  }
  return false;
}

/** Rejoin PDF soft-wrapped bullet/body lines before experience parsing. */
function coalesceWrappedLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (out.length === 0) {
      out.push(trimmed);
      continue;
    }

    const prev = out[out.length - 1];
    const prevIsBullet = BULLET_RE.test(prev);
    const curIsBullet = BULLET_RE.test(trimmed);
    const curIsHeader = looksLikeJobHeader(trimmed);

    if (prevIsBullet && !curIsBullet && !curIsHeader) {
      out[out.length - 1] = `${prev} ${trimmed}`;
      continue;
    }

    out.push(trimmed);
  }
  return out;
}

function parseExperienceBlock(lines: string[]): Experience[] {
  const jobs: Experience[] = [];
  let i = 0;
  const cleaned = coalesceWrappedLines(lines);

  while (i < cleaned.length) {
    const line = cleaned[i];
    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      // Orphan bullet — attach to last job or skip
      if (jobs.length > 0) {
        jobs[jobs.length - 1].bullets.push(bulletMatch[1].trim());
      }
      i += 1;
      continue;
    }

    // Company line (often "Company, Location")
    const companyLine = line;
    i += 1;
    let title = "";
    let startDate = "";
    let endDate = "";
    let current = false;
    const bullets: string[] = [];

    if (i < cleaned.length && !BULLET_RE.test(cleaned[i])) {
      const titleLine = cleaned[i];
      i += 1;
      // Prefer "Title  |  Jan 2022 – Present" (Redox TXT/DOCX export shape)
      const pipeParts = titleLine.split(/\s*\|\s*/).map((p) => p.trim());
      if (pipeParts.length >= 2) {
        title = pipeParts[0];
        const dates = parseDateRange(pipeParts.slice(1).join(" – "));
        startDate = dates.startDate;
        endDate = dates.endDate;
        current = dates.current;
      } else {
        // "Title – Jan 2020 – Present" or "Title — Jan 2020 - Aug 2021"
        const dashParts = titleLine
          .split(/\s+[–—]\s+/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (
          dashParts.length >= 3 &&
          (MONTH_YEAR_RE.test(dashParts[dashParts.length - 2]) ||
            /\d{4}/.test(dashParts[dashParts.length - 2]))
        ) {
          title = dashParts.slice(0, -2).join(" – ");
          startDate = dashParts[dashParts.length - 2];
          const endRaw = dashParts[dashParts.length - 1];
          current = /present|current/i.test(endRaw);
          endDate = current ? "" : endRaw;
        } else if (
          dashParts.length === 2 &&
          (MONTH_YEAR_RE.test(dashParts[1]) ||
            /present|current|\d{4}/i.test(dashParts[1]))
        ) {
          title = dashParts[0];
          const dates = parseDateRange(dashParts[1]);
          startDate = dates.startDate;
          endDate = dates.endDate;
          current = dates.current || /present|current/i.test(dashParts[1]);
        } else {
          title = titleLine;
        }
      }
    }

    while (i < cleaned.length && BULLET_RE.test(cleaned[i])) {
      const m = cleaned[i].match(BULLET_RE);
      if (m) bullets.push(m[1].trim());
      i += 1;
    }

    const companyParts = companyLine.split(",").map((p) => p.trim());
    const company = companyParts[0] ?? companyLine;
    const location = companyParts.slice(1).join(", ");

    if (company || title || bullets.length) {
      jobs.push({
        id: generateId(),
        company,
        location,
        title,
        startDate,
        endDate,
        current,
        bullets,
      });
    }
  }

  return jobs;
}

function parseEducationBlock(lines: string[]): Education[] {
  const entries: Education[] = [];
  const cleaned = lines.map((l) => l.trim()).filter(Boolean);
  let i = 0;

  while (i < cleaned.length) {
    const line = cleaned[i];
    i += 1;
    if (BULLET_RE.test(line)) continue;

    const pipeParts = line.split(/\s*\|\s*/).map((p) => p.trim());
    let institutionLine = pipeParts[0];
    let graduationDate = pipeParts[1] ?? "";
    const institutionParts = institutionLine.split(",").map((p) => p.trim());
    const institution = institutionParts[0] ?? "";
    const location = institutionParts.slice(1).join(", ");

    let details = "";
    if (i < cleaned.length && !BULLET_RE.test(cleaned[i])) {
      // Next line might be details (degree) unless it looks like another school line with |
      const next = cleaned[i];
      const nextIsNewEntry =
        /\|\s*[A-Za-z]{3,9}\.?\s+\d{4}/.test(next) ||
        /^[A-Z][A-Za-z .'-]+,\s*[A-Z]{2}\b/.test(next);
      if (!nextIsNewEntry) {
        details = next;
        i += 1;
      }
    }

    if (institution || details) {
      entries.push({
        id: generateId(),
        institution,
        location,
        details,
        graduationDate,
      });
    }
  }

  return entries;
}

function parseSkillsBlock(lines: string[]): SkillGroup[] {
  const groups: SkillGroup[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const withoutBullet = line.replace(BULLET_RE, "$1").trim();
    const colon = withoutBullet.indexOf(":");
    if (colon > 0 && colon < withoutBullet.length - 1) {
      groups.push({
        id: generateId(),
        category: withoutBullet.slice(0, colon).trim(),
        items: withoutBullet.slice(colon + 1).trim(),
      });
    } else {
      groups.push({
        id: generateId(),
        category: "",
        items: withoutBullet,
      });
    }
  }
  return groups;
}

function experienceToCustomEntries(jobs: Experience[]): CustomSectionEntry[] {
  return jobs.map((job) => ({
    id: generateId(),
    name: job.company,
    location: job.location,
    subtitle: job.title,
    startDate: job.startDate,
    endDate: job.endDate,
    current: job.current,
    bullets: job.bullets,
  }));
}

/**
 * Shared structured parser: plain text (from PDF or DOCX) → resume fields.
 * Tuned for Redox TXT/DOCX export shape and similar ATS-style resumes.
 */
export function parseResumeText(text: string): ParsedResumeFields {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ");

  const lines = normalized
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""));

  const { preamble, sections } = splitSections(lines);
  const contact = parseContactFromPreamble(preamble);

  let summary = "";
  const experience: Experience[] = [];
  const skillGroups: SkillGroup[] = [];
  const education: Education[] = [];
  const customSections: CustomSection[] = [];

  for (const section of sections) {
    switch (section.kind.type) {
      case "summary":
        summary = section.lines
          .map((l) => l.trim())
          .filter(Boolean)
          .join(" ")
          .trim();
        break;
      case "experience":
        experience.push(...parseExperienceBlock(section.lines));
        break;
      case "education":
        education.push(...parseEducationBlock(section.lines));
        break;
      case "skills":
        skillGroups.push(...parseSkillsBlock(section.lines));
        break;
      case "custom": {
        const jobs = parseExperienceBlock(section.lines);
        customSections.push({
          id: generateId(),
          title: section.kind.title,
          entries: experienceToCustomEntries(jobs),
        });
        break;
      }
      default:
        break;
    }
  }

  // Fallback: if no sections found, treat body after name as summary
  if (
    !summary &&
    experience.length === 0 &&
    education.length === 0 &&
    skillGroups.length === 0
  ) {
    const rest = preamble.slice(contact.headline ? 2 : 1).join(" ").trim();
    if (rest && !EMAIL_RE.test(rest)) {
      summary = rest.slice(0, 2000);
    }
  }

  return {
    contact,
    summary,
    experience,
    skillGroups,
    education,
    customSections,
  };
}
