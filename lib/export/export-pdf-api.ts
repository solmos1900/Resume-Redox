import { NextRequest, NextResponse } from "next/server";
import { getExportFilename } from "@/lib/export";
import { renderResumePdf } from "@/lib/export/render-resume-pdf";
import {
  PDF_EXPORT_MAX_BODY_BYTES,
  parseExportResumeVersion,
} from "@/lib/export/validate-export-payload";
import {
  requireFirebaseUserFromRequest,
  type VerifiedFirebaseUser,
} from "@/lib/server/firebase-auth";
import { withPdfExportSlot } from "@/lib/server/pdf-concurrency";
import { checkPdfExportRateLimits } from "@/lib/server/rate-limit";
import {
  PayloadTooLargeError,
  readLimitedJson,
} from "@/lib/server/read-limited-json";
import type { ResumeVersion } from "@/lib/schema";

export type ExportPdfApiDeps = {
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
  render: (version: ResumeVersion) => Promise<Uint8Array>;
  withSlot: <T>(fn: () => Promise<T>) => Promise<T>;
  maxBodyBytes: number;
};

const defaultDeps: ExportPdfApiDeps = {
  requireUser: requireFirebaseUserFromRequest,
  checkRateLimits: checkPdfExportRateLimits,
  render: renderResumePdf,
  withSlot: withPdfExportSlot,
  maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
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
 * Authenticated, rate-limited, size-capped PDF export handler.
 * Extracted for unit tests with mocked auth/renderer.
 */
export async function handleExportPdfPost(
  request: NextRequest,
  deps: ExportPdfApiDeps = defaultDeps
): Promise<NextResponse> {
  const auth = await deps.requireUser(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
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
        error: `Too many PDF export requests (${rate.scope} limit). Try again shortly.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSec),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await readLimitedJson(request, deps.maxBodyBytes);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    throw error;
  }

  const versionInput =
    body && typeof body === "object" && "version" in body
      ? (body as { version: unknown }).version
      : undefined;

  const parsed = parseExportResumeVersion(versionInput);
  if (!parsed.ok) {
    const oversized = parsed.error.issues.some(
      (issue) =>
        issue.code === "too_big" ||
        issue.message.toLowerCase().includes("too big")
    );
    return NextResponse.json(
      {
        error: oversized
          ? "Resume payload has oversized fields"
          : "Invalid resume data",
        details: parsed.error.flatten(),
      },
      { status: oversized ? 400 : 400 }
    );
  }

  try {
    const pdf = await deps.withSlot(() => deps.render(parsed.data));
    const filename = getExportFilename(parsed.data);

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF export failed";
    console.error("PDF export failed:", error);
    const timedOut = /timed out/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: timedOut ? 504 : 500 }
    );
  }
}
