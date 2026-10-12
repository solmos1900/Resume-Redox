export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDateRange(
  startDate: string,
  endDate: string,
  current: boolean
): string {
  const end = current ? "Present" : endDate;
  if (!startDate && !end) return "";
  if (!startDate) return end;
  if (!end) return startDate;
  return `${startDate} – ${end}`;
}

/** ATS-friendly contact separator — pipes parse more reliably than bullet glyphs. */
export const CONTACT_FIELD_SEPARATOR = " | ";

export function formatContactLine(parts: (string | undefined)[]): string {
  return parts.filter((p) => p && p.trim()).join(CONTACT_FIELD_SEPARATOR);
}

/** Leading list markers users may have typed into bullet fields. */
const LEADING_BULLET_RE =
  /^[\u2022\u2023\u25E6\u2043\u2219•●◦‣▪▸\-*–—]\s+/;

/**
 * Prefix a real U+2022 bullet in the text layer. CSS ::before bullets often
 * extract as detached glyphs (or vanish), so ATS parsers see paragraphs.
 */
export function withAtsBullet(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return `• ${trimmed.replace(LEADING_BULLET_RE, "")}`;
}
