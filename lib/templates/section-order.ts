/**
 * Canonical resume section order — shared by live templates, PDF, DOCX, TXT.
 *
 * Contact is always pinned at top (not reorderable) for v1.
 * Reorderable body: summary → experience → custom → skills → education (default).
 */

export const REORDERABLE_SECTION_IDS = [
  "summary",
  "experience",
  "custom",
  "skills",
  "education",
] as const;

export type ReorderableSectionId = (typeof REORDERABLE_SECTION_IDS)[number];

export const DEFAULT_SECTION_ORDER: ReorderableSectionId[] = [
  ...REORDERABLE_SECTION_IDS,
];

export const RESUME_SECTION_ORDER = [
  "contact",
  ...DEFAULT_SECTION_ORDER,
] as const;

export type ResumeSectionId =
  | "contact"
  | ReorderableSectionId;

export const SECTION_LABELS: Record<ResumeSectionId, string> = {
  contact: "Contact",
  summary: "Summary",
  experience: "Experience",
  custom: "Custom sections",
  skills: "Skills",
  education: "Education",
};

export function normalizeSectionOrder(
  order?: readonly string[] | null
): ReorderableSectionId[] {
  const seen = new Set<ReorderableSectionId>();
  const normalized: ReorderableSectionId[] = [];

  for (const raw of order ?? []) {
    if (raw === "contact") continue;
    if (
      (REORDERABLE_SECTION_IDS as readonly string[]).includes(raw) &&
      !seen.has(raw as ReorderableSectionId)
    ) {
      const id = raw as ReorderableSectionId;
      seen.add(id);
      normalized.push(id);
    }
  }

  for (const id of DEFAULT_SECTION_ORDER) {
    if (!seen.has(id)) normalized.push(id);
  }

  return normalized;
}

/** Full export/preview order including pinned contact. */
export function getOrderedSectionIds(
  order?: readonly string[] | null
): ResumeSectionId[] {
  return ["contact", ...normalizeSectionOrder(order)];
}

export function moveSection(
  order: readonly ReorderableSectionId[],
  fromIndex: number,
  toIndex: number
): ReorderableSectionId[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= order.length ||
    toIndex >= order.length ||
    fromIndex === toIndex
  ) {
    return [...order];
  }
  const next = [...order];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
