import {
  detectImportFormat,
  extractResumeText,
  looksLikeImageOnlyPdf,
} from "./extract-text";
import { parseResumeText } from "./parse-resume-text";
import {
  buildImportVersion,
  summarizeParsedFields,
} from "./build-import-version";
import type { ImportParseError, ImportParseResult } from "./types";

export async function parseResumeFile(input: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
}): Promise<ImportParseResult | ImportParseError> {
  const format = detectImportFormat(input.fileName, input.mimeType);
  if (!format) {
    return {
      ok: false,
      error: "Unsupported file type. Upload a PDF or DOCX resume.",
      fileName: input.fileName,
    };
  }

  let text = "";
  try {
    text = await extractResumeText(input.buffer, format);
  } catch (err) {
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
        ? "This PDF looks image-only (no selectable text). OCR is out of scope for Phase 2 — try a text PDF or DOCX."
        : "No text found in this file.",
      format,
      fileName: input.fileName,
      likelyImageOnly,
    };
  }

  const fields = parseResumeText(text);
  const summary = summarizeParsedFields(fields);
  const warnings: string[] = [];

  if (!summary.hasName) {
    warnings.push("Could not detect a name — please fill it in after import.");
  }
  if (!summary.hasContact) {
    warnings.push(
      "Contact details were incomplete — check email / phone / location."
    );
  }
  if (summary.experienceCount === 0) {
    warnings.push(
      "No experience entries detected — review the Experience section after import."
    );
  } else if (summary.bulletCount === 0) {
    warnings.push(
      "Experience titles were found but no bullets — you may need to add them."
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
