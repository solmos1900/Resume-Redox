const DOWNLOAD_COUNTS_KEY = "resume-redox-download-counts";

function readCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DOWNLOAD_COUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, number>;
    }
    return {};
  } catch {
    return {};
  }
}

function writeCounts(counts: Record<string, number>): void {
  try {
    localStorage.setItem(DOWNLOAD_COUNTS_KEY, JSON.stringify(counts));
  } catch {
    // Ignore storage failures (e.g. private browsing quota).
  }
}

/**
 * Returns "Name.ext" the first time a given base name + extension is
 * downloaded, then "Name (1).ext", "Name (2).ext", ... on repeats.
 * Tracked in localStorage so it's stable across sessions, independent of
 * whatever de-dup behavior the browser's downloads folder does on its own.
 */
export function getNextDownloadFilename(baseName: string, ext: string): string {
  const key = `${baseName}.${ext}`.toLowerCase();
  const counts = readCounts();
  const count = counts[key] ?? 0;
  counts[key] = count + 1;
  writeCounts(counts);
  return count === 0 ? `${baseName}.${ext}` : `${baseName} (${count}).${ext}`;
}

/** Triggers a browser download of `blob` named via `getNextDownloadFilename`. */
export function downloadBlob(blob: Blob, baseName: string, ext: string): void {
  const filename = getNextDownloadFilename(baseName, ext);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
