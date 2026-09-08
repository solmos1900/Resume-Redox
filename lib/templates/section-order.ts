/**
 * Canonical resume section order — must match live template components
 * in `components/preview/templates/ResumeTemplates.tsx`:
 *
 * contact → summary → experience → custom sections → skills → education
 *
 * PDF uses the same React templates (single visual path).
 * DOCX/TXT consume this order for content parity (ATS text siblings).
 */
export const RESUME_SECTION_ORDER = [
  "contact",
  "summary",
  "experience",
  "custom",
  "skills",
  "education",
] as const;

export type ResumeSectionId = (typeof RESUME_SECTION_ORDER)[number];
