/**
 * Client entry for Download → PDF.
 * Posts the active resume to /api/export-pdf with a Firebase ID token.
 * The API verifies the token server-side before spawning Chromium.
 */
import type { ResumeVersion } from "./schema";
import { getExportFilename } from "./export";
import { downloadBlob } from "./download-history";
import { auth } from "./firebase";

export async function downloadResumeAsPdf(
  version: ResumeVersion
): Promise<void> {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error("You must be signed in to download a PDF.");
  }

  const idToken = await user.getIdToken();

  const response = await fetch("/api/export-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
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
