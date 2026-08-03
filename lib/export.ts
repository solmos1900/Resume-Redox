import type { ResumeVersion } from "./schema";
import { resumeVersionSchema } from "./schema";

const PRINT_SESSION_PREFIX = "resume-redox-print:";
const PRINT_SESSION_TTL_MS = 120_000;

export type ExportSessionOptions = {
  exportedAt: string;
  includeTimestampOnResume: boolean;
};

type PrintSession = {
  version: ResumeVersion;
  expires: number;
  options?: ExportSessionOptions;
};

function toFilenameToken(value: string): string {
  return value
    .replace(/[/\\?%*:|"<>]/g, "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

/** e.g. Alex_Rivera_TAM_Resume */
export function getExportFilename(version: ResumeVersion): string {
  const fullName = version.contact.fullName.trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const first = toFilenameToken(nameParts[0] ?? "Resume");
  const last = toFilenameToken(nameParts.slice(1).join(" ") || "Candidate");

  const roleName = version.name.trim();
  const skipRole =
    !roleName || /^new resume$/i.test(roleName) || /^resume$/i.test(roleName);
  if (skipRole) {
    return `${first}_${last}_Resume`;
  }

  const role = toFilenameToken(roleName);
  return `${first}_${last}_${role}_Resume`;
}

export function formatExportTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Client-side print session (Vercel-safe; no server disk). */
export function createPrintSession(version: ResumeVersion): string {
  const token = crypto.randomUUID();
  const session: PrintSession = {
    version,
    expires: Date.now() + PRINT_SESSION_TTL_MS,
    options: {
      exportedAt: new Date().toISOString(),
      includeTimestampOnResume: false,
    },
  };
  localStorage.setItem(PRINT_SESSION_PREFIX + token, JSON.stringify(session));
  return token;
}

export function getPrintSession(token: string): PrintSession | null {
  try {
    const raw = localStorage.getItem(PRINT_SESSION_PREFIX + token);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PrintSession;
    if (parsed.expires < Date.now()) {
      localStorage.removeItem(PRINT_SESSION_PREFIX + token);
      return null;
    }
    const version = resumeVersionSchema.safeParse(parsed.version);
    if (!version.success) return null;
    return {
      version: version.data,
      expires: parsed.expires,
      options: parsed.options,
    };
  } catch {
    return null;
  }
}

export function openPrintPreview(token: string): void {
  const url = `/export/preview?token=${encodeURIComponent(token)}&print=1`;
  const printWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!printWindow) {
    throw new Error("Pop-up blocked. Allow pop-ups to print.");
  }
}

/**
 * Opens the print dialog. Use the browser’s “Save as PDF” destination.
 * (Server Puppeteer PDF is archived under `_archived/features/pdf-puppeteer/`.)
 */
export function saveResumeAsPdf(version: ResumeVersion): void {
  const token = createPrintSession(version);
  openPrintPreview(token);
}
