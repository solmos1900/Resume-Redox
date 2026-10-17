import {
  detectImportFormat,
  extractResumeText,
  ImportExtractLimitError,
  looksLikeImageOnlyPdf,
} from "./extract-text";
import { parseResumeText } from "./parse-resume-text";
import {
  buildImportVersion,
  summarizeParsedFields,
} from "./build-import-version";
import {
  IMPORT_MAX_PDF_PAGES,
  IMPORT_MAX_TEXT_CHARS,
  IMPORT_PARSE_TIMEOUT_MS,
} from "./import-limits";
import type { ImportParseError, ImportParseResult } from "./types";

export class ImportParseTimeoutError extends Error {
  constructor(message = "Import timed out while reading this file.") {
    super(message);
    this.name = "ImportParseTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ImportParseTimeoutError());
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export async function parseResumeFile(input: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
  maxPages?: number;
  maxTextChars?: number;
  timeoutMs?: number;
}): Promise<ImportParseResult | ImportParseError> {
  const format = detectImportFormat(input.fileName, input.mimeType);
  if (!format) {
    return {
      ok: false,
      error: "Unsupported file type. Upload a PDF or DOCX resume.",
      fileName: input.fileName,
    };
  }

  const maxPages = input.maxPages ?? IMPORT_MAX_PDF_PAGES;
  const maxTextChars = input.maxTextChars ?? IMPORT_MAX_TEXT_CHARS;
  const timeoutMs = input.timeoutMs ?? IMPORT_PARSE_TIMEOUT_MS;

  let text = "";
  try {
    text = await withTimeout(
      extractResumeText(input.buffer, format, { maxPages, maxTextChars }),
      timeoutMs
    );
  } catch (err) {
    if (err instanceof ImportExtractLimitError) {
      return {
        ok: false,
        error: err.message,
        format,
        fileName: input.fileName,
      };
    }
    if (err instanceof ImportParseTimeoutError) {
      return {
        ok: false,
        error: err.message,
        format,
        fileName: input.fileName,
      };
    }
    const message =
      err instanceof Error ? err.message : "Could not read this file.";
    return {
      ok: false,
      error: `Failed to extract text from ${format.toUpperCase()}: ${message}`,
      format,
      fileName: input.fileName,
    };
  }

  const likelyImageOnly =
    format === "pdf" && looksLikeImageOnlyPdf(text);

  if (!text.trim() || likelyImageOnly) {
    return {
      ok: false,
      error: likelyImageOnly
        ? "This PDF has little or no selectable text (likely image-only / scanned). Text extraction cannot map fields — try a text PDF or DOCX. OCR is out of scope for this release."
        : "No text was extracted from this file.",
      format,
      fileName: input.fileName,
      likelyImageOnly,
    };
  }

  const fields = parseResumeText(text);
  const summary = summarizeParsedFields(fields);
  const warnings: string[] = [];

  if (!summary.hasName) {
    warnings.push("Name was not detected — fill it in after import if needed.");
  }
  if (!summary.hasContact) {
    warnings.push(
      "Contact looked incomplete — check email, phone, and location."
    );
  }
  if (summary.experienceCount === 0) {
    warnings.push(
      "No experience section mapped — add roles manually after import if needed."
    );
  } else if (summary.bulletCount === 0) {
    warnings.push(
      "Experience titles mapped but no bullets found — add bullets after import if needed."
    );
  }
  if (text.length >= maxTextChars) {
    warnings.push(
      "Extracted text hit the length limit — some later content may be missing."
    );
  }

  const version = buildImportVersion(fields, { fileName: input.fileName });

  return {
    ok: true,
    format,
    fileName: input.fileName,
    text,
    fields,
    suggestedName: version.name,
    warnings,
    likelyImageOnly: false,
  };
}

export type { ImportParseResult, ImportParseError, ParsedResumeFields } from "./types";
export { parseResumeText } from "./parse-resume-text";
export { buildImportVersion, summarizeParsedFields } from "./build-import-version";
