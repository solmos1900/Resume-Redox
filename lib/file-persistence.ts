import { storeSchema, type StoreState } from "./schema";

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

export async function importStoreFromFile(file: File): Promise<StoreState | null> {
  try {
    const text = await file.text();
    const parsed = storeSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
