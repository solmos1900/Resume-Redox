import type { Contact, Experience } from "@/lib/schema";
import type { ParsedResumeFields } from "@/lib/import/types";

export type FieldFill = "filled" | "empty" | "partial";

export function fillStatus(value: string | undefined | null): FieldFill {
  return value?.trim() ? "filled" : "empty";
}

export function contactFillStatus(contact: Contact): FieldFill {
  const parts = [
    contact.fullName,
    contact.email,
    contact.phone,
    contact.location,
  ];
  const filled = parts.filter((p) => p?.trim()).length;
  if (filled === 0) return "empty";
  if (filled >= 3 && contact.fullName?.trim()) return "filled";
  return "partial";
}

export function experienceFillStatus(jobs: Experience[]): FieldFill {
  if (jobs.length === 0) return "empty";
  const complete = jobs.every(
    (j) =>
      (j.title.trim() || j.company.trim()) && j.bullets.some((b) => b.trim())
  );
  if (complete) return "filled";
  return "partial";
}

export function cloneFields(fields: ParsedResumeFields): ParsedResumeFields {
  return structuredClone(fields);
}
