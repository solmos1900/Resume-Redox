import { createRoot } from "react-dom/client";
import { createElement } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ResumeVersion } from "./schema";
import { ExportPreviewShell } from "@/components/preview/ExportPreviewShell";
import {
  LETTER_WIDTH_IN,
  LETTER_HEIGHT_IN,
  LETTER_WIDTH_PX,
  LETTER_HEIGHT_PX,
  PX_PER_IN,
} from "./page-fit";
import { getExportFilename } from "./export";
import { downloadBlob } from "./download-history";

const CAPTURE_SCALE = 2;

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (typeof document.fonts?.ready?.then === "function") {
          document.fonts.ready.then(() => resolve());
        } else {
          resolve();
        }
      });
    });
  });
}

async function renderOffscreen(
  version: ResumeVersion
): Promise<{ container: HTMLElement; cleanup: () => void }> {
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(createElement(ExportPreviewShell, { version }));

  await waitForLayout();

  return {
    container,
    cleanup: () => {
      root.unmount();
      container.remove();
    },
  };
}

async function captureToPdf(container: HTMLElement): Promise<Blob> {
  const documentNode = container.querySelector<HTMLElement>(".resume-document");
  if (!documentNode) {
    throw new Error("Could not find resume content to export.");
  }
  documentNode.classList.add("pdf-export-mode");

  const canvas = await html2canvas(documentNode, {
    scale: CAPTURE_SCALE,
    backgroundColor: "#ffffff",
    width: LETTER_WIDTH_PX,
    windowWidth: LETTER_WIDTH_PX,
  });

  const pdf = new jsPDF({ unit: "in", format: "letter" });
  const pageHeightPx = LETTER_HEIGHT_PX * CAPTURE_SCALE;
  const totalHeightPx = canvas.height;
  const pageCount = Math.max(1, Math.ceil(totalHeightPx / pageHeightPx));

  for (let page = 0; page < pageCount; page++) {
    const sourceY = page * pageHeightPx;
    const sliceHeightPx = Math.min(pageHeightPx, totalHeightPx - sourceY);

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare PDF page.");
    ctx.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    );

    if (page > 0) pdf.addPage("letter");
    const imageHeightIn = sliceHeightPx / CAPTURE_SCALE / PX_PER_IN;
    pdf.addImage(
      sliceCanvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      LETTER_WIDTH_IN,
      imageHeightIn
    );
  }

  return pdf.output("blob");
}

/** Renders the resume off-screen and downloads it as a PDF — no new tab, no print dialog. */
export async function downloadResumeAsPdf(version: ResumeVersion): Promise<void> {
  const { container, cleanup } = await renderOffscreen(version);
  try {
    const blob = await captureToPdf(container);
    downloadBlob(blob, getExportFilename(version), "pdf");
  } finally {
    cleanup();
  }
}
