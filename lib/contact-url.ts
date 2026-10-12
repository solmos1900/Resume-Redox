/**
 * Normalize LinkedIn for hrefs and ATS-visible display.
 * Prefer www.linkedin.com so parsers recognize the profile URL.
 */
export function formatLinkedInDisplay(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  let path = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "");

  // Bare profile slug → /in/slug
  if (!/[./]/.test(path)) {
    path = `linkedin.com/in/${path}`;
  } else if (/^linkedin\.com\/?$/i.test(path)) {
    return "www.linkedin.com";
  } else if (!/^linkedin\.com\//i.test(path)) {
    // Non-LinkedIn URL — return cleaned host/path without forcing linkedin.com
    return trimmed.replace(/^https?:\/\//i, "");
  }

  return `www.${path.replace(/^linkedin\.com/i, "linkedin.com")}`;
}

export function normalizeLinkedInUrl(value: string): string {
  const display = formatLinkedInDisplay(value);
  if (!display) return "";
  if (/^https?:\/\//i.test(display)) return display;
  return `https://${display}`;
}

export function hasContactLineInfo(contact: {
  phone?: string;
  email?: string;
  linkedIn?: string;
  location?: string;
}): boolean {
  return [contact.phone, contact.email, contact.linkedIn, contact.location].some(
    (part) => part?.trim()
  );
}
