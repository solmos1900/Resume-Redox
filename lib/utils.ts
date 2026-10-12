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

/**
 * Company • City, ST — bullet (not comma) so names like "Horizon SaaS Co."
 * don't steal the state when ATS split on commas (TheLadders dropped "IL").
 */
export function formatCompanyLocation(
  company: string,
  location: string
): string {
  const c = company.trim();
  const l = location.trim();
  if (c && l) return `${c} • ${l}`;
  return c || l;
}

/** ATS-friendly contact separator — pipes parse more reliably than bullet glyphs. */
export const CONTACT_FIELD_SEPARATOR = " | ";

export function formatContactLine(parts: (string | undefined)[]): string {
  return parts.filter((p) => p && p.trim()).join(CONTACT_FIELD_SEPARATOR);
}

/**
 * Normalize US-style phones to `(555) 234-0100` with ASCII hyphen-minus.
 * Some PDF fonts drop or remap hyphens; TheLadders then shows (555) 2680142.
 */
export function formatAtsPhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  let d = digits;
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  // Preserve unknown shapes but force ASCII hyphens/dashes to hyphen-minus.
  return trimmed.replace(/[\u2010-\u2015\u2212]/g, "-");
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
