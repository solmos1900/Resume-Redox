/**
 * Section labels ATS parsers look for. Prefer Title Case in the text layer —
 * freecvaudit flagged missing/unlabelled sections after all-caps v3 headings.
 * ALL CAPS remains available for A/B via atsHeadingCase.
 */
export const ATS_SECTION_TITLE = {
  summary: "Summary",
  profile: "Profile",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
} as const;

export const ATS_SECTION_UPPER = {
  summary: "SUMMARY",
  profile: "PROFILE",
  experience: "EXPERIENCE",
  skills: "SKILLS",
  education: "EDUCATION",
} as const;

/** @deprecated use ATS_SECTION_UPPER / getAtsSectionTitle */
export const ATS_SECTION = ATS_SECTION_UPPER;

export type AtsSectionId = keyof typeof ATS_SECTION_TITLE;
export type AtsHeadingCase = "title" | "upper";
export type AtsSummaryKind = "summary" | "profile";

export function getAtsSectionTitle(
  id: AtsSectionId,
  headingCase: AtsHeadingCase = "title"
): string {
  return headingCase === "upper"
    ? ATS_SECTION_UPPER[id]
    : ATS_SECTION_TITLE[id];
}

export function getAtsSummaryTitle(
  kind: AtsSummaryKind,
  headingCase: AtsHeadingCase = "title"
): string {
  return getAtsSectionTitle(kind, headingCase);
}

export function formatCustomSectionTitle(
  title: string,
  headingCase: AtsHeadingCase = "title"
): string {
  const raw = title.trim() || "Section";
  if (headingCase === "upper") return raw.toUpperCase();
  // Title Case each word for ATS-friendly custom headings (e.g. Certifications)
  return raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
