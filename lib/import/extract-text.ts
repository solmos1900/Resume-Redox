import mammoth from "mammoth";
import type { ImportSourceFormat } from "./types";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;

export function detectImportFormat(
  fileName: string,
  mimeType?: string
): ImportSourceFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  if (
    lower.endsWith(".docx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  return null;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // pdfjs legacy build works in Node without a worker for text extraction.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const lineChunks: string[] = [];
    let lastY: number | null = null;
    let currentLine = "";

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const str = String(item.str ?? "");
      if (!str) continue;
      const y =
        "transform" in item && Array.isArray(item.transform)
          ? Number(item.transform[5])
          : null;

      if (lastY !== null && y !== null && Math.abs(lastY - y) > 2) {
        if (currentLine.trim()) lineChunks.push(currentLine.trim());
        currentLine = str;
      } else {
        const needsSpace =
          currentLine.length > 0 &&
          !currentLine.endsWith(" ") &&
          !str.startsWith(" ");
        currentLine += needsSpace ? ` ${str}` : str;
      }
      if (y !== null) lastY = y;
    }
    if (currentLine.trim()) lineChunks.push(currentLine.trim());
    pages.push(lineChunks.join("\n"));
  }

  return pages.join("\n\n").replace(/\u00a0/g, " ").trim();
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return (result.value ?? "").replace(/\u00a0/g, " ").trim();
}

export async function extractResumeText(
  buffer: Buffer,
  format: ImportSourceFormat
): Promise<string> {
  if (format === "pdf") return extractTextFromPdf(buffer);
  return extractTextFromDocx(buffer);
}

export function looksLikeImageOnlyPdf(text: string): boolean {
  const compact = text.replace(/\s+/g, "");
  if (compact.length < 40) return true;
  // Almost no letters → likely scanned/image PDF without a text layer.
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  return letters < 20;
}

export function peekContactHints(text: string): {
  email?: string;
  phone?: string;
} {
  const email = text.match(EMAIL_RE)?.[0];
  const phone = text.match(PHONE_RE)?.[0];
  return { email, phone };
}
