/**
 * Regression tests for PDF export auth + abuse guards (issue #41).
 * Run: npx tsx scripts/test-export-pdf-security.ts
 *  or: npm run test:export-pdf-security
 */
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createSeedVersion } from "../lib/seed-data";
import { handleExportPdfPost } from "../lib/export/export-pdf-api";
import {
  PDF_EXPORT_MAX_BODY_BYTES,
  PDF_EXPORT_MAX_STRING,
  parseExportResumeVersion,
} from "../lib/export/validate-export-payload";
import {
  createRateLimiter,
  MemoryRateLimitStore,
  resetPdfExportRateLimitsForTests,
} from "../lib/server/rate-limit";
import {
  extractBearerToken,
  FirebaseAuthConfigError,
  getFirebaseProjectId,
  isFirebaseServerAuthConfigured,
} from "../lib/server/firebase-auth";
import {
  resetPdfExportConcurrencyForTests,
  withPdfExportSlot,
  getActivePdfExportCount,
} from "../lib/server/pdf-concurrency";
import {
  PayloadTooLargeError,
  readLimitedBodyBytes,
  readLimitedJson,
} from "../lib/server/read-limited-json";
import type { VerifiedFirebaseUser } from "../lib/server/firebase-auth";
import type { ResumeVersion } from "../lib/schema";

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

function mockUser(uid = "test-user-1"): VerifiedFirebaseUser {
  return { uid, payload: { sub: uid } };
}

function jsonRequest(
  body: unknown,
  init?: {
    authorization?: string | null;
    contentLength?: string;
    ip?: string;
  }
): NextRequest {
  const raw =
    typeof body === "string" ? body : JSON.stringify(body ?? {});
  const headers = new Headers({
    "content-type": "application/json",
  });
  if (init?.authorization !== null) {
    headers.set(
      "authorization",
      init?.authorization ?? "Bearer valid-test-token"
    );
  }
  if (init?.contentLength) {
    headers.set("content-length", init.contentLength);
  }
  if (init?.ip) {
    headers.set("x-forwarded-for", init.ip);
  }
  return new NextRequest("http://localhost/api/export-pdf", {
    method: "POST",
    headers,
    body: raw,
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
      controller.enqueue(new Uint8Array(size).fill(0x61)); // 'a'
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
    "content-type": "application/json",
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
  return new NextRequest("http://localhost/api/export-pdf", {
    method: "POST",
    headers,
    // duplex is required by undici/fetch for streaming request bodies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...( { body: stream, duplex: "half" } as any ),
  });
}

const okAuthDeps = {
  requireUser: async () => ({ ok: true as const, user: mockUser() }),
  checkRateLimits: async () => ({ ok: true as const }),
  render: async () => {
    throw new Error("render should not run");
  },
  withSlot: async <T>(fn: () => Promise<T>) => fn(),
};

async function main() {
  await test("extractBearerToken parses Authorization header", () => {
    assert.equal(extractBearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
    assert.equal(extractBearerToken("bearer xyz"), "xyz");
    assert.equal(extractBearerToken("Basic nope"), null);
    assert.equal(extractBearerToken(null), null);
  });

  await test("server auth reports configured from env project id", () => {
    const prev =
      process.env.FIREBASE_PROJECT_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-project";
    delete process.env.FIREBASE_PROJECT_ID;
    assert.equal(getFirebaseProjectId(), "demo-project");
    assert.equal(isFirebaseServerAuthConfigured(), true);
    if (prev) {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = prev;
    } else {
      delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    }
  });

  await test("FirebaseAuthConfigError is a distinct error type", () => {
    const err = new FirebaseAuthConfigError();
    assert.equal(err.name, "FirebaseAuthConfigError");
  });

  await test("unauthenticated request returns 401", async () => {
    resetPdfExportRateLimitsForTests();
    const version = createSeedVersion();
    const res = await handleExportPdfPost(
      jsonRequest({ version }, { authorization: null }),
      {
        requireUser: async () => ({
          ok: false,
          status: 401,
          error: "Authentication required. Sign in and retry.",
        }),
        checkRateLimits: async () => ({ ok: true }),
        render: async () => {
          throw new Error("render should not run");
        },
        withSlot: async (fn) => fn(),
        maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
      }
    );
    assert.equal(res.status, 401);
    const data = (await res.json()) as { error: string };
    assert.match(data.error, /auth/i);
  });

  await test("missing auth config returns 503 (fail closed)", async () => {
    const version = createSeedVersion();
    const res = await handleExportPdfPost(jsonRequest({ version }), {
      requireUser: async () => ({
        ok: false,
        status: 503,
        error: "PDF export is unavailable: server auth is not configured.",
      }),
      checkRateLimits: async () => ({ ok: true }),
      render: async () => {
        throw new Error("render should not run");
      },
      withSlot: async (fn) => fn(),
      maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
    });
    assert.equal(res.status, 503);
  });

  await test("oversized Content-Length returns 413", async () => {
    resetPdfExportRateLimitsForTests();
    const version = createSeedVersion();
    const res = await handleExportPdfPost(
      jsonRequest(
        { version },
        {
          contentLength: String(PDF_EXPORT_MAX_BODY_BYTES + 1),
        }
      ),
      {
        ...okAuthDeps,
        maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
      }
    );
    assert.equal(res.status, 413);
  });

  await test("under-limit JSON body is accepted by readLimitedJson", async () => {
    const payload = JSON.stringify({ ok: true, n: 1 });
    const req = jsonRequest(payload);
    const parsed = await readLimitedJson(req, PDF_EXPORT_MAX_BODY_BYTES);
    assert.deepEqual(parsed, { ok: true, n: 1 });
  });

  await test(
    "stream reader accepts body exactly at maxBytes",
    async () => {
      const maxBytes = 64;
      const { stream, getBytesPulled } = trackedChunkStream(16, maxBytes);
      const text = await readLimitedBodyBytes(stream, maxBytes);
      assert.equal(Buffer.byteLength(text, "utf8"), maxBytes);
      assert.equal(getBytesPulled(), maxBytes);
    }
  );

  await test(
    "stream reader aborts over-limit body without unbounded pull",
    async () => {
      const maxBytes = 256;
      const chunkSize = 64;
      // Pretend a multi-megabyte body; only a bounded prefix should be pulled.
      const claimedTotal = 5 * 1024 * 1024;
      const { stream, getBytesPulled } = trackedChunkStream(
        chunkSize,
        claimedTotal
      );

      await assert.rejects(
        () => readLimitedBodyBytes(stream, maxBytes),
        (err: unknown) => {
          assert.ok(err instanceof PayloadTooLargeError);
          assert.equal(err.status, 413);
          return true;
        }
      );

      const pulled = getBytesPulled();
      // One chunk past the limit is enough to detect overflow; never the full body.
      assert.ok(pulled > maxBytes);
      assert.ok(
        pulled <= maxBytes + chunkSize,
        `expected bounded pull <= ${maxBytes + chunkSize}, got ${pulled}`
      );
      assert.ok(
        pulled < claimedTotal,
        `reader must not pull the full ${claimedTotal} byte body`
      );
    }
  );

  await test(
    "missing Content-Length still enforces stream byte cap (413)",
    async () => {
      resetPdfExportRateLimitsForTests();
      const maxBytes = 512;
      const chunkSize = 128;
      const claimedTotal = 8 * 1024 * 1024;
      const { stream, getBytesPulled } = trackedChunkStream(
        chunkSize,
        claimedTotal
      );
      const res = await handleExportPdfPost(
        streamRequest(stream, { contentLength: null }),
        {
          ...okAuthDeps,
          maxBodyBytes: maxBytes,
        }
      );
      assert.equal(res.status, 413);
      const pulled = getBytesPulled();
      // Allow a couple of queued chunks from stream HWM / cancel races,
      // but never anything near the claimed multi-megabyte body.
      assert.ok(
        pulled <= maxBytes + chunkSize * 4,
        `expected bounded pull <= ${maxBytes + chunkSize * 4}, got ${pulled}`
      );
      assert.ok(pulled < claimedTotal / 100);
    }
  );

  await test(
    "lying undersized Content-Length cannot bypass stream cap (413)",
    async () => {
      resetPdfExportRateLimitsForTests();
      const maxBytes = 512;
      const chunkSize = 128;
      const claimedTotal = 4 * 1024 * 1024;
      const { stream, getBytesPulled } = trackedChunkStream(
        chunkSize,
        claimedTotal
      );
      const res = await handleExportPdfPost(
        streamRequest(stream, {
          // Claim a small body while streaming far more bytes.
          contentLength: String(Math.floor(maxBytes / 2)),
        }),
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

  await test(
    "under-limit streamed body without Content-Length reaches JSON parse",
    async () => {
      resetPdfExportRateLimitsForTests();
      const version = createSeedVersion();
      const raw = JSON.stringify({ version });
      assert.ok(Buffer.byteLength(raw, "utf8") < PDF_EXPORT_MAX_BODY_BYTES);

      const bytes = new TextEncoder().encode(raw);
      let pulled = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (pulled >= bytes.byteLength) {
            controller.close();
            return;
          }
          const next = bytes.subarray(pulled, pulled + 64);
          pulled += next.byteLength;
          controller.enqueue(next);
        },
      });

      let rendered = false;
      const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      const res = await handleExportPdfPost(
        streamRequest(stream, { contentLength: null }),
        {
          requireUser: async () => ({ ok: true, user: mockUser() }),
          checkRateLimits: async () => ({ ok: true }),
          render: async () => {
            rendered = true;
            return fakePdf;
          },
          withSlot: async (fn) => fn(),
          maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
        }
      );
      assert.equal(res.status, 200);
      assert.equal(rendered, true);
    }
  );

  await test("oversized string field is rejected", () => {
    const version = createSeedVersion() as ResumeVersion;
    version.contact.fullName = "x".repeat(PDF_EXPORT_MAX_STRING + 1);
    const parsed = parseExportResumeVersion(version);
    assert.equal(parsed.ok, false);
  });

  await test("oversized array field is rejected", () => {
    const version = createSeedVersion() as ResumeVersion;
    version.experience = Array.from({ length: 50 }, (_, i) => ({
      id: `e${i}`,
      company: "Co",
      location: "Loc",
      title: "Title",
      startDate: "2020",
      endDate: "2021",
      current: false,
      bullets: ["one"],
    }));
    const parsed = parseExportResumeVersion(version);
    assert.equal(parsed.ok, false);
  });

  await test("valid seed version passes export size validation", () => {
    const parsed = parseExportResumeVersion(createSeedVersion());
    assert.equal(parsed.ok, true);
  });

  await test("legacy payload without ATS fields gets defaults and renders", async () => {
    resetPdfExportRateLimitsForTests();
    const {
      atsContactLayout: _layout,
      atsSummaryHeading: _heading,
      atsHeadingCase: _case,
      ...legacyVersion
    } = createSeedVersion();

    const parsed = parseExportResumeVersion(legacyVersion);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.atsContactLayout, "inline");
    assert.equal(parsed.data.atsSummaryHeading, "summary");
    assert.equal(parsed.data.atsHeadingCase, "title");

    const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    let renderedAts: {
      atsContactLayout: string;
      atsSummaryHeading: string;
      atsHeadingCase: string;
    } | null = null;
    const res = await handleExportPdfPost(jsonRequest({ version: legacyVersion }), {
      requireUser: async () => ({ ok: true, user: mockUser() }),
      checkRateLimits: async () => ({ ok: true }),
      render: async (v) => {
        renderedAts = {
          atsContactLayout: v.atsContactLayout,
          atsSummaryHeading: v.atsSummaryHeading,
          atsHeadingCase: v.atsHeadingCase,
        };
        return fakePdf;
      },
      withSlot: async (fn) => fn(),
      maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(renderedAts, {
      atsContactLayout: "inline",
      atsSummaryHeading: "summary",
      atsHeadingCase: "title",
    });
  });

  await test("payload with ATS fields passes them through to render", async () => {
    resetPdfExportRateLimitsForTests();
    const version = createSeedVersion();
    version.atsContactLayout = "stacked";
    version.atsSummaryHeading = "profile";
    version.atsHeadingCase = "upper";

    const parsed = parseExportResumeVersion(version);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.atsContactLayout, "stacked");
    assert.equal(parsed.data.atsSummaryHeading, "profile");
    assert.equal(parsed.data.atsHeadingCase, "upper");

    const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    let renderedAts: {
      atsContactLayout: string;
      atsSummaryHeading: string;
      atsHeadingCase: string;
    } | null = null;
    const res = await handleExportPdfPost(jsonRequest({ version }), {
      requireUser: async () => ({ ok: true, user: mockUser() }),
      checkRateLimits: async () => ({ ok: true }),
      render: async (v) => {
        renderedAts = {
          atsContactLayout: v.atsContactLayout,
          atsSummaryHeading: v.atsSummaryHeading,
          atsHeadingCase: v.atsHeadingCase,
        };
        return fakePdf;
      },
      withSlot: async (fn) => fn(),
      maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(renderedAts, {
      atsContactLayout: "stacked",
      atsSummaryHeading: "profile",
      atsHeadingCase: "upper",
    });
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

  await test("API returns 429 when rate limited", async () => {
    const version = createSeedVersion();
    const res = await handleExportPdfPost(jsonRequest({ version }), {
      requireUser: async () => ({ ok: true, user: mockUser() }),
      checkRateLimits: async () => ({
        ok: false,
        retryAfterSec: 42,
        scope: "user",
      }),
      render: async () => {
        throw new Error("render should not run");
      },
      withSlot: async (fn) => fn(),
      maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
    });
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "42");
  });

  await test("authenticated valid request renders PDF (mocked)", async () => {
    resetPdfExportRateLimitsForTests();
    const version = createSeedVersion();
    const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    let rendered = false;
    const res = await handleExportPdfPost(jsonRequest({ version }), {
      requireUser: async () => ({ ok: true, user: mockUser() }),
      checkRateLimits: async () => ({ ok: true }),
      render: async (v) => {
        rendered = true;
        assert.equal(v.id, version.id);
        return fakePdf;
      },
      withSlot: async (fn) => fn(),
      maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/pdf");
    assert.equal(rendered, true);
    const buf = Buffer.from(await res.arrayBuffer());
    assert.deepEqual(buf, Buffer.from(fakePdf));
  });

  await test("concurrency slot serializes excess work", async () => {
    resetPdfExportConcurrencyForTests();
    // Cap is env-driven (default 2). Fill both slots, then ensure a waiter queues.
    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    const firstGate = new Promise<void>((r) => {
      releaseFirst = r;
    });
    const secondGate = new Promise<void>((r) => {
      releaseSecond = r;
    });

    const p1 = withPdfExportSlot(async () => {
      await firstGate;
      return 1;
    });
    const p2 = withPdfExportSlot(async () => {
      await secondGate;
      return 2;
    });

    // Allow microtasks to acquire both slots.
    await new Promise((r) => setImmediate(r));
    assert.equal(getActivePdfExportCount(), 2);

    let thirdStarted = false;
    const p3 = withPdfExportSlot(async () => {
      thirdStarted = true;
      return 3;
    });

    await new Promise((r) => setImmediate(r));
    assert.equal(thirdStarted, false);

    releaseFirst();
    await p1;
    await new Promise((r) => setImmediate(r));
    assert.equal(thirdStarted, true);

    releaseSecond();
    await Promise.all([p2, p3]);
    resetPdfExportConcurrencyForTests();
  });

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log("\nAll export-pdf security tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
