import type { ResumeVersion } from "@/lib/schema";
import type { ParsedResumeFields } from "./types";
import { summarizeParsedFields } from "./build-import-version";

/** True when the active resume has any user content worth protecting. */
export function isResumeNonEmpty(version: ResumeVersion | undefined): boolean {
  if (!version) return false;
  const c = version.contact;
  if (
    c.fullName?.trim() ||
    c.email?.trim() ||
    c.phone?.trim() ||
    c.headline?.trim() ||
    c.location?.trim() ||
    c.linkedIn?.trim()
  ) {
    return true;
  }
  if (version.summary?.trim()) return true;
  if (version.experience.some((e) => e.company.trim() || e.title.trim() || e.bullets.some((b) => b.trim()))) {
    return true;
  }
  if (version.education.some((e) => e.institution.trim() || e.details.trim())) {
    return true;
  }
  if (version.skillGroups.some((g) => g.category.trim() || g.items.trim())) {
    return true;
  }
  if (
    (version.customSections ?? []).some(
      (s) =>
        s.title.trim() ||
        s.entries.some(
          (e) => e.name.trim() || e.subtitle.trim() || e.bullets.some((b) => b.trim())
        )
    )
  ) {
    return true;
  }
  return false;
}

export type ExtractQuality = "complete" | "partial" | "empty";

export function getExtractQuality(fields: ParsedResumeFields): ExtractQuality {
  const s = summarizeParsedFields(fields);
  const hasCore =
    s.hasName && s.hasContact && s.experienceCount > 0 && s.bulletCount > 0;
  if (hasCore) {
    // Still partial if summary/education/skills all missing — but happy path is core
    return "complete";
  }
  if (
    s.hasName ||
    s.hasContact ||
    s.experienceCount > 0 ||
    fields.summary.trim() ||
    s.educationCount > 0 ||
    s.skillGroupCount > 0
  ) {
    return "partial";
  }
  return "empty";
}
