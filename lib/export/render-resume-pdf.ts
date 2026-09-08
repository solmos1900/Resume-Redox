import type { ResumeVersion } from "@/lib/schema";
import { launchPdfBrowser } from "@/lib/export/launch-pdf-browser";

/**
 * Render a text PDF by printing the live export preview page in Chromium.
 * Injects the resume into the page context (no shared server session), so the
 * PDF uses the same React templates + app CSS as the editor preview.
 *
 * Engine: Chromium/Skia — selectable text + embedded fonts (FlowCV-class),
 * not an html2canvas raster.
 */
export async function renderResumePdf(
  version: ResumeVersion,
  baseUrl: string
): Promise<Uint8Array> {
  const browser = await launchPdfBrowser();

  try {
    const page = await browser.newPage();

    await page.evaluateOnNewDocument((payload) => {
      (
        window as Window & {
          __RESUME_REDOX_EXPORT__?: unknown;
        }
      ).__RESUME_REDOX_EXPORT__ = payload;
    }, version);

    const url = `${baseUrl.replace(/\/$/, "")}/export/preview?chromium=1`;
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    await page.waitForSelector("#resume-export-root .resume-document", {
      timeout: 30_000,
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    // Allow React to paint injected session content.
    await new Promise((r) => setTimeout(r, 250));

    // Match on-screen preview colors (grays + accent), not forced print black.
    await page.emulateMediaType("screen");

    // Collapse export chrome/padding so the letter page is only the resume.
    await page.addStyleTag({
      content: `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        .export-layout {
          padding: 0 !important;
          margin: 0 !important;
          min-height: 0 !important;
          display: block !important;
        }
        .export-status-banner,
        .no-print {
          display: none !important;
        }
        .resume-export-root {
          margin: 0 !important;
        }
        .resume-document a {
          color: inherit !important;
        }
        vercel-live-feedback,
        [data-vercel-toolbar],
        [data-vercel-toolbar-rel],
        #vercel-live-feedback,
        #vercel-live-feedback-root {
          display: none !important;
        }
      `,
    });

    const pdf = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}
