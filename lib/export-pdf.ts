/**
 * Client entry for Download → PDF.
 * Posts the resume to /api/export-pdf with a Firebase ID token (a signed-in
 * account or a silent guest session). The API verifies the token
 * server-side before spawning Chromium.
 */
import type { ResumeVersion } from "./schema";
import { getExportFilename } from "./export";
import { downloadBlob } from "./download-history";

export class PdfServiceUnavailableError extends Error {
  constructor(message = "The PDF service is unavailable right now.") {
    super(message);
    this.name = "PdfServiceUnavailableError";
  }
}

export async function downloadResumeAsPdf(
  version: ResumeVersion,
  idToken: string | null
): Promise<void> {
  if (!idToken) throw new PdfServiceUnavailableError();

  let response: Response;
  try {
    response = await fetch("/api/export-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ version }),
    });
  } catch {
    throw new PdfServiceUnavailableError();
  }

  if (!response.ok) {
    let message = "PDF download failed.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore JSON parse errors
    }
    // Auth / config / capacity problems: the caller falls back to the
    // browser's Save-as-PDF so the user is never blocked.
    if ([401, 403, 429, 500, 502, 503, 504].includes(response.status)) {
      throw new PdfServiceUnavailableError(message);
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  downloadBlob(blob, getExportFilename(version), "pdf");
}
