export function normalizeLinkedInUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^www\./i, "")}`;
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
