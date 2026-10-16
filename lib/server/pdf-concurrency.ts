/**
 * Per-isolate concurrency cap for Chromium PDF renders.
 * Prevents a single warm serverless instance from spawning unbounded browsers.
 */

const MAX_CONCURRENT_PDF_RENDERS = Math.max(
  1,
  Number.parseInt(process.env.PDF_EXPORT_MAX_CONCURRENCY || "2", 10) || 2
);

let active = 0;
const waitQueue: Array<() => void> = [];

export function getPdfExportConcurrencyCap(): number {
  return MAX_CONCURRENT_PDF_RENDERS;
}

export function getActivePdfExportCount(): number {
  return active;
}

export async function withPdfExportSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquirePdfSlot();
  try {
    return await fn();
  } finally {
    releasePdfSlot();
  }
}

function acquirePdfSlot(): Promise<void> {
  if (active < MAX_CONCURRENT_PDF_RENDERS) {
    active += 1;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    waitQueue.push(() => {
      active += 1;
      resolve();
    });
  });
}

function releasePdfSlot(): void {
  active = Math.max(0, active - 1);
  const next = waitQueue.shift();
  if (next) next();
}

/** Test helper */
export function resetPdfExportConcurrencyForTests(): void {
  active = 0;
  waitQueue.length = 0;
}
