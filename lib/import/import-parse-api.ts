import { NextRequest, NextResponse } from "next/server";
import { buildImportVersion } from "@/lib/import/build-import-version";
import {
  formatImportMaxFileMb,
  IMPORT_MAX_BODY_BYTES,
  IMPORT_MAX_FILE_BYTES,
} from "@/lib/import/import-limits";
import { parseResumeFile } from "@/lib/import/parse-file";
import {
  requireFirebaseUserFromRequest,
  type VerifiedFirebaseUser,
} from "@/lib/server/firebase-auth";
import { checkImportParseRateLimits } from "@/lib/server/rate-limit";
import {
  PayloadTooLargeError,
  readLimitedRequestBody,
} from "@/lib/server/read-limited-json";

export type ImportParseApiDeps = {
  requireUser: (
    request: NextRequest
  ) => Promise<
    | { ok: true; user: VerifiedFirebaseUser }
    | { ok: false; status: 401 | 503; error: string }
  >;
  checkRateLimits: (input: {
    uid: string;
    ip: string | null;
  }) => Promise<
    | { ok: true }
    | { ok: false; retryAfterSec: number; scope: "user" | "ip" }
  >;
  parseFile: typeof parseResumeFile;
  maxBodyBytes: number;
  maxFileBytes: number;
};

const defaultDeps: ImportParseApiDeps = {
  requireUser: requireFirebaseUserFromRequest,
  checkRateLimits: checkImportParseRateLimits,
  parseFile: parseResumeFile,
  maxBodyBytes: IMPORT_MAX_BODY_BYTES,
  maxFileBytes: IMPORT_MAX_FILE_BYTES,
};

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

/**
 * Authenticated, rate-limited, size-capped resume import parse handler.
 * Extracted for unit tests with mocked auth/parser.
 */
export async function handleImportParsePost(
  request: NextRequest,
  deps: ImportParseApiDeps = defaultDeps
): Promise<NextResponse> {
  const auth = await deps.requireUser(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  const rate = await deps.checkRateLimits({
    uid: auth.user.uid,
    ip: clientIp(request),
  });
  if (!rate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many import requests (${rate.scope} limit). Try again shortly.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSec),
        },
      }
    );
  }

  let bodyBytes: Uint8Array;
  try {
    bodyBytes = await readLimitedRequestBody(request, deps.maxBodyBytes);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json(
        {
          ok: false,
          error: `File is too large (max ${formatImportMaxFileMb()} MB).`,
        },
        { status: 413 }
      );
    }
    throw error;
  }

  if (bodyBytes.byteLength === 0) {
    return NextResponse.json(
      { ok: false, error: "Missing file. Upload a PDF or DOCX." },
      { status: 400 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let form: FormData;
  try {
    // Copy into a fresh ArrayBuffer-backed Buffer for Request BodyInit typing.
    const bodyInit = Buffer.from(bodyBytes);
    const rebuilt = new Request(request.url, {
      method: "POST",
      headers: contentType ? { "content-type": contentType } : undefined,
      body: bodyInit,
    });
    form = await rebuilt.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid multipart upload." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Missing file. Upload a PDF or DOCX." },
      { status: 400 }
    );
  }

  if (file.size > deps.maxFileBytes) {
    return NextResponse.json(
      {
        ok: false,
        error: `File is too large (max ${formatImportMaxFileMb()} MB).`,
      },
      { status: 413 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > deps.maxFileBytes) {
      return NextResponse.json(
        {
          ok: false,
          error: `File is too large (max ${formatImportMaxFileMb()} MB).`,
        },
        { status: 413 }
      );
    }

    const result = await deps.parseFile({
      buffer,
      fileName: file.name || "resume",
      mimeType: file.type,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 422 });
    }

    const version = buildImportVersion(result.fields, {
      name: result.suggestedName,
      fileName: result.fileName,
    });

    return NextResponse.json({
      ok: true,
      format: result.format,
      fileName: result.fileName,
      suggestedName: result.suggestedName,
      warnings: result.warnings,
      likelyImageOnly: result.likelyImageOnly,
      fields: result.fields,
      version,
      // Keep a short preview of extracted text for empty/error UX — not the full dump
      textPreview: result.text.slice(0, 500),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected import error.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
