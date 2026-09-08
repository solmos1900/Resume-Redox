/**
 * Client entry for Download → PDF.
 * Posts the active resume to /api/export-pdf, which renders the same
 * React templates in Chromium and returns a text (selectable) letter PDF.
 */
import type { ResumeVersion } from "./schema";
import { getExportFilename } from "./export";
import { downloadBlob } from "./download-history";

export async function downloadResumeAsPdf(
  version: ResumeVersion
): Promise<void> {
  const response = await fetch("/api/export-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version }),
  });

  if (!response.ok) {
    let message = "PDF download failed.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  downloadBlob(blob, getExportFilename(version), "pdf");
}
