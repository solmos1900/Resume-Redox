/**
 * Normalize LinkedIn for ATS-visible plain text.
 * TheLadders / freecvaudit miss bare www.linkedin.com or https://linkedin.com
 * without www — emit https://www.linkedin.com/in/... every time.
 */
export function formatLinkedInDisplay(value: string): string {
  return normalizeLinkedInUrl(value);
}

export function normalizeLinkedInUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  let path = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "");

  if (!/[./]/.test(path)) {
    path = `linkedin.com/in/${path}`;
  } else if (/^linkedin\.com\/?$/i.test(path)) {
    return "https://www.linkedin.com";
  } else if (!/^linkedin\.com\//i.test(path)) {
    // Non-LinkedIn URL — return as absolute https when missing a scheme
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed.replace(/^https?:\/\//i, "")}`;
  }

  const normalized = path.replace(/^linkedin\.com/i, "linkedin.com");
  return `https://www.${normalized}`;
}

/** Absolute https URL for portfolio / GitHub / personal site. */
export function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function formatWebsiteDisplay(value: string): string {
  return normalizeWebsiteUrl(value);
}

export function hasContactLineInfo(contact: {
  phone?: string;
  email?: string;
  linkedIn?: string;
  location?: string;
  website?: string;
}): boolean {
  return [
    contact.phone,
    contact.email,
    contact.linkedIn,
    contact.location,
    contact.website,
  ].some((part) => part?.trim());
}
