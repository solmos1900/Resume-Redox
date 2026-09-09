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
