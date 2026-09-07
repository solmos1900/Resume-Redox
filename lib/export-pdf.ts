import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { ResumeVersion } from "./schema";
import { getExportFilename } from "./export";
import {
  LETTER_HEIGHT_IN,
  LETTER_WIDTH_IN,
  LETTER_HEIGHT_PX,
  LETTER_WIDTH_PX,
} from "./page-fit";

/**
 * Build a clean letter-size PDF from the on-screen resume export node.
 * Avoids browser print chrome (URL/date footers) and host overlays (e.g. Vercel toolbar).
 */
export async function downloadResumeAsPdf(
  version: ResumeVersion,
  root: HTMLElement = document.getElementById("resume-export-root")!
): Promise<void> {
  if (!root) {
    throw new Error("Resume export root not found.");
  }

  const documentEl =
    (root.querySelector(".resume-document") as HTMLElement | null) ?? root;

  documentEl.classList.add("pdf-export-mode");

  // Ensure the capture canvas is at least one full letter page tall so
  // bottom whitespace (margins) isn't cropped away.
  const previousMinHeight = documentEl.style.minHeight;
  documentEl.style.minHeight = `${LETTER_HEIGHT_PX}px`;

  try {
    const canvas = await html2canvas(documentEl, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      width: LETTER_WIDTH_PX,
      windowWidth: LETTER_WIDTH_PX,
      // Ignore floating host UI that can sit over the page (Vercel toolbar, etc.)
      ignoreElements: (el) => {
        const tag = el.tagName?.toLowerCase?.() ?? "";
        if (tag === "vercel-live-feedback") return true;
        if (el.id?.includes("vercel")) return true;
        if (
          el.getAttribute?.("data-vercel-toolbar") != null ||
          el.getAttribute?.("data-vercel-toolbar-rel") != null
        ) {
          return true;
        }
        return false;
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
      compress: true,
    });

    const pageWidth = LETTER_WIDTH_IN;
    const pageHeight = LETTER_HEIGHT_IN;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height / canvas.width) * pageWidth;
    const imgData = canvas.toDataURL("image/png");

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    while (heightLeft > 0.01) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );
      heightLeft -= pageHeight;
    }

    pdf.save(`${getExportFilename(version)}.pdf`);
  } finally {
    documentEl.classList.remove("pdf-export-mode");
    documentEl.style.minHeight = previousMinHeight;
  }
}

export function openPdfDownload(token: string): void {
  const url = `/export/preview?token=${encodeURIComponent(token)}&download=1`;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    throw new Error("Pop-up blocked. Allow pop-ups to download the PDF.");
  }
}
