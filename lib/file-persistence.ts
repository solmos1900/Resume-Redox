import { z } from "zod";
import {
  resumeVersionSchema,
  storeSchema,
  type ResumeVersion,
  type StoreState,
} from "./schema";

function toFilenameToken(value: string): string {
  return value
    .replace(/[/\\?%*:|"<>]/g, "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export type ResumeBackupFile = {
  title: string;
  exportedAt: string;
  resume: ResumeVersion;
};

const resumeBackupFileSchema = z.object({
  title: z.string(),
  exportedAt: z.string(),
  resume: resumeVersionSchema,
});

export function getResumeBackupFilename(version: ResumeVersion, date = new Date()): string {
  const title =
    toFilenameToken(version.name.trim()) ||
    toFilenameToken(version.contact.fullName.trim()) ||
    "Resume";
  const day = date.toISOString().slice(0, 10);
  return `${title}_${day}.json`;
}

/** Download the currently active resume (not the full store). */
export function downloadResumeBackup(version: ResumeVersion): void {
  const exportedAt = new Date().toISOString();
  const payload: ResumeBackupFile = {
    title: version.name.trim() || "Untitled Resume",
    exportedAt,
    resume: version,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getResumeBackupFilename(version, new Date(exportedAt));
  anchor.click();
  URL.revokeObjectURL(url);
}

/** @deprecated Prefer downloadResumeBackup for the active resume. */
export function downloadStoreBackup(state: StoreState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `resume-redox-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Accepts a single-resume backup, full store backup, or bare resume version. */
export async function importStoreFromFile(
  file: File
): Promise<ResumeVersion[] | null> {
  try {
    const text = await file.text();
    const json = JSON.parse(text) as unknown;

    const asBackup = resumeBackupFileSchema.safeParse(json);
    if (asBackup.success) {
      return [asBackup.data.resume];
    }

    const asStore = storeSchema.safeParse(json);
    if (asStore.success && asStore.data.versions.length > 0) {
      return asStore.data.versions;
    }

    const asVersion = resumeVersionSchema.safeParse(json);
    if (asVersion.success) {
      return [asVersion.data];
    }

    return null;
  } catch {
    return null;
  }
}
