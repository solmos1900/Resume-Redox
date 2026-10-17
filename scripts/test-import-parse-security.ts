/**
 * Regression tests for import-parse auth + abuse guards (issue #42).
 * Run: npx tsx scripts/test-import-parse-security.ts
 *  or: npm run test:import-parse-security
 */
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import {
  IMPORT_MAX_BODY_BYTES,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_PDF_PAGES,
} from "../lib/import/import-limits";
import { handleImportParsePost } from "../lib/import/import-parse-api";
import {
  extractTextFromPdf,
  ImportExtractLimitError,
} from "../lib/import/extract-text";
import { parseResumeFile } from "../lib/import/parse-file";
import {
  createRateLimiter,
  MemoryRateLimitStore,
  resetImportParseRateLimitsForTests,
} from "../lib/server/rate-limit";
import {
  PayloadTooLargeError,
  readLimitedBodyBuffer,
} from "../lib/server/read-limited-json";
import type { VerifiedFirebaseUser } from "../lib/server/firebase-auth";
import type { ImportParseResult } from "../lib/import/types";

let failed = 0;

function pass(name: string) {
  console.log(`PASS ${name}`);
}

function fail(name: string, err: unknown) {
  failed += 1;
  console.error(`FAIL ${name}:`, err);
}

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

function mockUser(uid = "import-test-user"): VerifiedFirebaseUser {
  return { uid, payload: { sub: uid } };
}

function okParseResult(): ImportParseResult {
  return {
    ok: true,
    format: "pdf",
    fileName: "resume.pdf",
    text: "Jane Doe\njane@example.com\nExperience\nAcme — Engineer\n- Shipped features",
    fields: {
      contact: {
        fullName: "Jane Doe",
        headline: "",
        email: "jane@example.com",
        phone: "",
        location: "",
        linkedIn: "",
        website: "",
        linkedInHyperlink: true,
      },
      summary: "",
      experience: [],
      skillGroups: [],
      education: [],
      customSections: [],
    },
    suggestedName: "Jane Doe",
    warnings: [],
    likelyImageOnly: false,
  };
}

async function tinyPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  return doc.save();
}

async function manyPagePdfBytes(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage([612, 792]);
    // pdf-lib embeds no text operators here — enough to exercise page count.
    page.drawText?.("x");
    try {
      page.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 12 });
    } catch {
      // drawText requires a font in some versions; page still counts.
    }
  }
  return doc.save();
}

function multipartRequest(
  fileBytes: Uint8Array,
  init?: {
    authorization?: string | null;
    contentLength?: string | null;
    ip?: string;
    fileName?: string;
  }
): NextRequest {
  const form = new FormData();
  const blob = new Blob([Buffer.from(fileBytes)], { type: "application/pdf" });
  form.append("file", blob, init?.fileName ?? "resume.pdf");

  const headers = new Headers();
  if (init?.authorization !== null) {
    headers.set(
      "authorization",
      init?.authorization ?? "Bearer valid-test-token"
    );
  }
  if (init?.contentLength != null) {
    headers.set("content-length", init.contentLength);
  }
  if (init?.ip) {
    headers.set("x-forwarded-for", init.ip);
  }

  return new NextRequest("http://localhost/api/import-parse", {
    method: "POST",
    headers,
    body: form,
  });
}

/**
 * Pull-based body stream so tests can prove we stop reading once the
 * byte cap is exceeded (no unbounded buffering in our reader).
 */
function trackedChunkStream(
  chunkSize: number,
  totalBytes: number
): { stream: ReadableStream<Uint8Array>; getBytesPulled: () => number } {
  let remaining = totalBytes;
  let bytesPulled = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (remaining <= 0) {
        controller.close();
        return;
      }
      const size = Math.min(chunkSize, remaining);
      bytesPulled += size;
      remaining -= size;
      controller.enqueue(new Uint8Array(size).fill(0x61));
    },
  });
  return {
    stream,
    getBytesPulled: () => bytesPulled,
  };
}

function streamRequest(
  stream: ReadableStream<Uint8Array>,
  init?: {
    authorization?: string | null;
    contentLength?: string | null;
    ip?: string;
  }
): NextRequest {
  const headers = new Headers({
    "content-type": "multipart/form-data; boundary=----test",
  });
  if (init?.authorization !== null) {
    headers.set(
      "authorization",
      init?.authorization ?? "Bearer valid-test-token"
    );
  }
  if (init?.contentLength != null) {
    headers.set("content-length", init.contentLength);
  }
  if (init?.ip) {
    headers.set("x-forwarded-for", init.ip);
  }
  return new NextRequest("http://localhost/api/import-parse", {
    method: "POST",
    headers,
    // duplex is required by undici/fetch for streaming request bodies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ body: stream, duplex: "half" } as any),
  });
}

const okAuthDeps = {
  requireUser: async () => ({ ok: true as const, user: mockUser() }),
  checkRateLimits: async () => ({ ok: true as const }),
  parseFile: async () => okParseResult(),
  maxBodyBytes: IMPORT_MAX_BODY_BYTES,
  maxFileBytes: IMPORT_MAX_FILE_BYTES,
};

async function main() {
  await test("unauthenticated request returns 401", async () => {
    resetImportParseRateLimitsForTests();
    const pdf = await tinyPdfBytes();
    const res = await handleImportParsePost(
      multipartRequest(pdf, { authorization: null }),
      {
        requireUser: async () => ({
          ok: false,
          status: 401,
          error: "Authentication required. Sign in and retry.",
        }),
        checkRateLimits: async () => ({ ok: true }),
        parseFile: async () => {
          throw new Error("parse should not run");
        },
        maxBodyBytes: IMPORT_MAX_BODY_BYTES,
        maxFileBytes: IMPORT_MAX_FILE_BYTES,
      }
    );
    assert.equal(res.status, 401);
    const data = (await res.json()) as { ok: false; error: string };
    assert.equal(data.ok, false);
    assert.match(data.error, /auth/i);
  });

  await test("missing auth config returns 503 (fail closed)", async () => {
    const pdf = await tinyPdfBytes();
    const res = await handleImportParsePost(multipartRequest(pdf), {
      requireUser: async () => ({
        ok: false,
        status: 503,
        error: "Server auth is not configured.",
      }),
      checkRateLimits: async () => ({ ok: true }),
      parseFile: async () => {
        throw new Error("parse should not run");
      },
      maxBodyBytes: IMPORT_MAX_BODY_BYTES,
      maxFileBytes: IMPORT_MAX_FILE_BYTES,
    });
    assert.equal(res.status, 503);
  });

  await test("oversized Content-Length returns 413", async () => {
    resetImportParseRateLimitsForTests();
    const pdf = await tinyPdfBytes();
    const res = await handleImportParsePost(
      multipartRequest(pdf, {
        contentLength: String(IMPORT_MAX_BODY_BYTES + 1),
      }),
      okAuthDeps
    );
    assert.equal(res.status, 413);
    const data = (await res.json()) as { ok: false; error: string };
    assert.match(data.error, /too large/i);
  });

  await test(
    "stream reader aborts over-limit body without unbounded pull",
    async () => {
      const maxBytes = 256;
      const chunkSize = 64;
      const claimedTotal = 5 * 1024 * 1024;
      const { stream, getBytesPulled } = trackedChunkStream(
        chunkSize,
        claimedTotal
      );

      await assert.rejects(
        () => readLimitedBodyBuffer(stream, maxBytes),
        (err: unknown) => {
          assert.ok(err instanceof PayloadTooLargeError);
          assert.equal(err.status, 413);
          return true;
        }
      );

      const pulled = getBytesPulled();
      assert.ok(pulled > maxBytes);
      assert.ok(
        pulled <= maxBytes + chunkSize,
        `expected bounded pull <= ${maxBytes + chunkSize}, got ${pulled}`
      );
      assert.ok(pulled < claimedTotal);
    }
  );

  await test(
    "missing Content-Length still enforces stream byte cap (413)",
    async () => {
      resetImportParseRateLimitsForTests();
      const maxBytes = 512;
      const chunkSize = 128;
      const claimedTotal = 8 * 1024 * 1024;
      const { stream, getBytesPulled } = trackedChunkStream(
        chunkSize,
        claimedTotal
      );
      const res = await handleImportParsePost(
        streamRequest(stream, { contentLength: null }),
        {
          ...okAuthDeps,
          maxBodyBytes: maxBytes,
        }
      );
      assert.equal(res.status, 413);
      const pulled = getBytesPulled();
      assert.ok(
        pulled <= maxBytes + chunkSize * 4,
        `expected bounded pull <= ${maxBytes + chunkSize * 4}, got ${pulled}`
      );
      assert.ok(pulled < claimedTotal / 100);
    }
  );

  await test("API returns 429 when rate limited", async () => {
    const pdf = await tinyPdfBytes();
    const res = await handleImportParsePost(multipartRequest(pdf), {
      requireUser: async () => ({ ok: true, user: mockUser() }),
      checkRateLimits: async () => ({
        ok: false,
        retryAfterSec: 33,
        scope: "user",
      }),
      parseFile: async () => {
        throw new Error("parse should not run");
      },
      maxBodyBytes: IMPORT_MAX_BODY_BYTES,
      maxFileBytes: IMPORT_MAX_FILE_BYTES,
    });
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "33");
  });

  await test("rate limiter blocks after limit", async () => {
    const store = new MemoryRateLimitStore();
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 60_000,
      store,
      now: () => 1_000_000,
    });
    assert.equal((await limiter.check("a")).allowed, true);
    assert.equal((await limiter.check("a")).allowed, true);
    const third = await limiter.check("a");
    assert.equal(third.allowed, false);
    assert.ok(third.retryAfterSec >= 1);
  });

  await test("authenticated valid request parses (mocked)", async () => {
    resetImportParseRateLimitsForTests();
    const pdf = await tinyPdfBytes();
    let parsed = false;
    const res = await handleImportParsePost(multipartRequest(pdf), {
      requireUser: async () => ({ ok: true, user: mockUser() }),
      checkRateLimits: async () => ({ ok: true }),
      parseFile: async (input) => {
        parsed = true;
        assert.ok(input.buffer.byteLength > 0);
        assert.equal(input.fileName, "resume.pdf");
        return okParseResult();
      },
      maxBodyBytes: IMPORT_MAX_BODY_BYTES,
      maxFileBytes: IMPORT_MAX_FILE_BYTES,
    });
    assert.equal(res.status, 200);
    assert.equal(parsed, true);
    const data = (await res.json()) as { ok: true; suggestedName: string };
    assert.equal(data.ok, true);
    assert.equal(data.suggestedName, "Jane Doe");
  });

  await test("PDF page cap rejects oversized page count", async () => {
    const bytes = await manyPagePdfBytes(IMPORT_MAX_PDF_PAGES + 1);
    await assert.rejects(
      () => extractTextFromPdf(Buffer.from(bytes)),
      (err: unknown) => {
        assert.ok(err instanceof ImportExtractLimitError);
        assert.match(err.message, /pages/i);
        return true;
      }
    );
  });

  await test("parseResumeFile surfaces page-cap error", async () => {
    const bytes = await manyPagePdfBytes(IMPORT_MAX_PDF_PAGES + 5);
    const result = await parseResumeFile({
      buffer: Buffer.from(bytes),
      fileName: "huge.pdf",
      mimeType: "application/pdf",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /pages/i);
    }
  });

  await test("PDF within page cap does not throw limit error", async () => {
    const bytes = await manyPagePdfBytes(2);
    // May extract little/no text without embedded fonts — must not throw limit.
    const text = await extractTextFromPdf(Buffer.from(bytes));
    assert.equal(typeof text, "string");
  });

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log("\nAll import-parse security tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
