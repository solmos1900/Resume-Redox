import {
  resumeVersionSchema,
  storeSchema,
  type ResumeVersion,
  type StoreState,
} from "./schema";

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

/** Accepts a full store backup or a single resume version. */
export async function importStoreFromFile(
  file: File
): Promise<ResumeVersion[] | null> {
  try {
    const text = await file.text();
    const json = JSON.parse(text) as unknown;

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
