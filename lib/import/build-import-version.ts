import {
  createEmptyVersion,
  type ResumeVersion,
} from "@/lib/schema";
import type { ParsedResumeFields } from "./types";

/** Build a full ResumeVersion from parsed import fields (defaults for design/template). */
export function buildImportVersion(
  fields: ParsedResumeFields,
  options?: { name?: string; fileName?: string }
): ResumeVersion {
  const fromContact = fields.contact.fullName?.trim();
  const fromFile = options?.fileName
    ?.replace(/\.(pdf|docx)$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const name =
    options?.name?.trim() ||
    fromContact ||
    fromFile ||
    "Imported Resume";

  const version = createEmptyVersion(name);
  version.contact = {
    ...version.contact,
    ...fields.contact,
    linkedInHyperlink: fields.contact.linkedInHyperlink ?? true,
  };
  version.summary = fields.summary ?? "";
  version.experience = fields.experience ?? [];
  version.skillGroups = fields.skillGroups ?? [];
  version.education = fields.education ?? [];
  version.customSections = fields.customSections ?? [];
  return version;
}

export function summarizeParsedFields(fields: ParsedResumeFields): {
  hasName: boolean;
  hasContact: boolean;
  experienceCount: number;
  bulletCount: number;
  educationCount: number;
  skillGroupCount: number;
  customSectionCount: number;
} {
  const c = fields.contact;
  const hasContact = Boolean(
    c.email?.trim() || c.phone?.trim() || c.location?.trim() || c.linkedIn?.trim()
  );
  return {
    hasName: Boolean(c.fullName?.trim()),
    hasContact,
    experienceCount: fields.experience.length,
    bulletCount: fields.experience.reduce(
      (n, job) => n + job.bullets.filter((b) => b.trim()).length,
      0
    ),
    educationCount: fields.education.length,
    skillGroupCount: fields.skillGroups.length,
    customSectionCount: fields.customSections.length,
  };
}
