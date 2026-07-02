import type { ResumeVersion } from "./schema";

export function getExportFilename(version: ResumeVersion): string {
  const resumeName = version.name.trim() || "Resume";
  const fullName = version.contact.fullName.trim() || "Untitled";
  return sanitizeFilename(`${resumeName} - ${fullName}`);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, " ").trim();
}

export async function saveResumeAsPdf(version: ResumeVersion): Promise<void> {
  const element = document.getElementById("resume-preview");
  if (!element) throw new Error("Resume preview not found");

  const filename = getExportFilename(version);
  const previousTitle = document.title;
  document.title = filename;

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf()
      .set({
        margin: [0.5, 0.75],
        filename: `${filename}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .from(element)
      .save();
  } finally {
    document.title = previousTitle;
  }
}

export function printResume(version: ResumeVersion): void {
  const filename = getExportFilename(version);
  const previousTitle = document.title;
  document.title = filename;

  const restore = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
