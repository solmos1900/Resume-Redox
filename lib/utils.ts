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

export function formatContactLine(parts: (string | undefined)[]): string {
  return parts.filter((p) => p && p.trim()).join(" • ");
}
