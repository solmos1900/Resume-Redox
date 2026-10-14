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
        requireUser: async () => ({ ok: true, user: mockUser() }),
        checkRateLimits: async () => ({ ok: true }),
        render: async () => {
          throw new Error("render should not run");
        },
        withSlot: async (fn) => fn(),
        maxBodyBytes: PDF_EXPORT_MAX_BODY_BYTES,
      }
    );
    assert.equal(res.status, 413);
  });

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
