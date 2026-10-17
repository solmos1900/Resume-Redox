import mammoth from "mammoth";
import type { ImportSourceFormat } from "./types";
import {
  IMPORT_MAX_PDF_PAGES,
  IMPORT_MAX_TEXT_CHARS,
} from "./import-limits";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;

export class ImportExtractLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportExtractLimitError";
  }
}

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

export type ExtractTextOptions = {
  maxPages?: number;
  maxTextChars?: number;
};

export async function extractTextFromPdf(
  buffer: Buffer,
  options: ExtractTextOptions = {}
): Promise<string> {
  const maxPages = options.maxPages ?? IMPORT_MAX_PDF_PAGES;
  const maxTextChars = options.maxTextChars ?? IMPORT_MAX_TEXT_CHARS;

  // pdfjs legacy build works in Node without a worker for text extraction.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;

  if (doc.numPages > maxPages) {
    throw new ImportExtractLimitError(
      `This PDF has ${doc.numPages} pages (max ${maxPages}). Use a shorter text-based resume.`
    );
  }

  const pages: string[] = [];
  let totalChars = 0;

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
    const pageText = lineChunks.join("\n");
    pages.push(pageText);
    totalChars += pageText.length + (pages.length > 1 ? 2 : 0);

    if (totalChars >= maxTextChars) {
      break;
    }
  }

  const joined = pages.join("\n\n").replace(/\u00a0/g, " ").trim();
  if (joined.length > maxTextChars) {
    return joined.slice(0, maxTextChars);
  }
  return joined;
}

export async function extractTextFromDocx(
  buffer: Buffer,
  options: ExtractTextOptions = {}
): Promise<string> {
  const maxTextChars = options.maxTextChars ?? IMPORT_MAX_TEXT_CHARS;
  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value ?? "").replace(/\u00a0/g, " ").trim();
  if (text.length > maxTextChars) {
    return text.slice(0, maxTextChars);
  }
  return text;
}

export async function extractResumeText(
  buffer: Buffer,
  format: ImportSourceFormat,
  options: ExtractTextOptions = {}
): Promise<string> {
  if (format === "pdf") return extractTextFromPdf(buffer, options);
  return extractTextFromDocx(buffer, options);
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
