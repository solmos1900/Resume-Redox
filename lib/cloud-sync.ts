import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { storeSchema, type StoreState } from "./schema";

function userDocRef(uid: string) {
  if (!db) throw new Error("Cloud save is not configured.");
  return doc(db, "resumeStores", uid);
}

export async function fetchCloudStore(uid: string): Promise<StoreState | null> {
  const snapshot = await getDoc(userDocRef(uid));
  if (!snapshot.exists()) return null;
  const parsed = storeSchema.safeParse(snapshot.data());
  return parsed.success ? parsed.data : null;
}

export async function saveCloudStore(uid: string, state: StoreState): Promise<void> {
  await setDoc(userDocRef(uid), {
    activeVersionId: state.activeVersionId,
    versions: state.versions,
    updatedAt: new Date().toISOString(),
  });
}
