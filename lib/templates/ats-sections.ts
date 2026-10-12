/**
 * Exact section labels ATS parsers look for. Use these literal strings in
 * templates (do not rely on CSS text-transform alone).
 */
export const ATS_SECTION = {
  summary: "SUMMARY",
  /** Alternate summary label used by some checkers / locales. */
  profile: "PROFILE",
  experience: "EXPERIENCE",
  skills: "SKILLS",
  education: "EDUCATION",
} as const;

export type AtsSummaryHeading =
  | typeof ATS_SECTION.summary
  | typeof ATS_SECTION.profile;
