/**
 * Resource bounds for POST /api/import-parse (issue #42).
 * Enforced server-side before/during pdf.js and mammoth work.
 */

/** Max uploaded file size (PDF or DOCX bytes). */
export const IMPORT_MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MiB

/**
 * Max multipart request body. Slightly above the file cap to allow
 * multipart MIME overhead (boundary + headers).
 */
export const IMPORT_MAX_BODY_BYTES = Math.floor(2.5 * 1024 * 1024);

/** Max PDF pages processed by pdf.js (resumes are typically 1–3). */
export const IMPORT_MAX_PDF_PAGES = 20;

/** Max characters of extracted text retained / processed. */
export const IMPORT_MAX_TEXT_CHARS = 100_000;

/** Hard wall-clock budget for extract + field mapping. */
export const IMPORT_PARSE_TIMEOUT_MS = 15_000;

export function formatImportMaxFileMb(): string {
  return String(IMPORT_MAX_FILE_BYTES / (1024 * 1024));
}
