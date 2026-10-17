/**
 * Best-effort sliding-window rate limiter for serverless.
 *
 * Default store is in-memory (per isolate). On Vercel this does not span
 * instances, so it reduces casual abuse on warm isolates but is not a
 * durable global quota. Documented in README / .env.example.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
  limit: number;
};

export type RateLimitStore = {
  /** Return timestamps (ms) still inside the window after recording this hit. */
  hit(key: string, windowMs: number, now: number): Promise<number[]>;
  clear?(): void;
};

/** In-memory store — per Node isolate / serverless instance. */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, number[]>();

  async hit(key: string, windowMs: number, now: number): Promise<number[]> {
    const cutoff = now - windowMs;
    const prev = this.buckets.get(key) ?? [];
    const kept = prev.filter((t) => t > cutoff);
    kept.push(now);
    this.buckets.set(key, kept);
    return kept;
  }

  clear(): void {
    this.buckets.clear();
  }
}

export type RateLimiterOptions = {
  /** Max hits allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  store?: RateLimitStore;
  now?: () => number;
};

export type RateLimiter = {
  check(key: string): Promise<RateLimitResult>;
  reset(): void;
};

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const store = options.store ?? new MemoryRateLimitStore();
  const nowFn = options.now ?? (() => Date.now());

  return {
    async check(key: string): Promise<RateLimitResult> {
      const now = nowFn();
      const hits = await store.hit(key, options.windowMs, now);
      const allowed = hits.length <= options.limit;
      const remaining = Math.max(0, options.limit - hits.length);
      const oldest = hits[0] ?? now;
      const retryAfterSec = allowed
        ? 0
        : Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));

      return {
        allowed,
        remaining,
        retryAfterSec,
        limit: options.limit,
      };
    },
    reset() {
      store.clear?.();
    },
  };
}

/** Shared default limiters for PDF export (per isolate). */
const pdfUserStore = new MemoryRateLimitStore();
const pdfIpStore = new MemoryRateLimitStore();

const pdfUserLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
  store: pdfUserStore,
});

const pdfIpLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
  store: pdfIpStore,
});

export async function checkPdfExportRateLimits(input: {
  uid: string;
  ip: string | null;
}): Promise<
  | { ok: true }
  | { ok: false; retryAfterSec: number; scope: "user" | "ip" }
> {
  const user = await pdfUserLimiter.check(`pdf:uid:${input.uid}`);
  if (!user.allowed) {
    return { ok: false, retryAfterSec: user.retryAfterSec, scope: "user" };
  }

  if (input.ip) {
    const ip = await pdfIpLimiter.check(`pdf:ip:${input.ip}`);
    if (!ip.allowed) {
      return { ok: false, retryAfterSec: ip.retryAfterSec, scope: "ip" };
    }
  }

  return { ok: true };
}

/** Test helper: reset shared PDF rate-limit buckets. */
export function resetPdfExportRateLimitsForTests(): void {
  pdfUserLimiter.reset();
  pdfIpLimiter.reset();
}

/** Shared default limiters for resume import parse (per isolate). */
const importUserStore = new MemoryRateLimitStore();
const importIpStore = new MemoryRateLimitStore();

const importUserLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
  store: importUserStore,
});

const importIpLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
  store: importIpStore,
});

export async function checkImportParseRateLimits(input: {
  uid: string;
  ip: string | null;
}): Promise<
  | { ok: true }
  | { ok: false; retryAfterSec: number; scope: "user" | "ip" }
> {
  const user = await importUserLimiter.check(`import:uid:${input.uid}`);
  if (!user.allowed) {
    return { ok: false, retryAfterSec: user.retryAfterSec, scope: "user" };
  }

  if (input.ip) {
    const ip = await importIpLimiter.check(`import:ip:${input.ip}`);
    if (!ip.allowed) {
      return { ok: false, retryAfterSec: ip.retryAfterSec, scope: "ip" };
    }
  }

  return { ok: true };
}

/** Test helper: reset shared import rate-limit buckets. */
export function resetImportParseRateLimitsForTests(): void {
  importUserLimiter.reset();
  importIpLimiter.reset();
}
