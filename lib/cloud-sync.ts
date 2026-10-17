import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { parseCloudStoreData } from "./cloud-store-parse";
import type { StoreState } from "./schema";

function userDocRef(uid: string) {
  if (!db) throw new Error("Cloud save is not configured.");
  return doc(db, "resumeStores", uid);
}

/**
 * Result of reading `resumeStores/{uid}`.
 * Only `missing` means it is safe to seed the cloud from local data.
 * `invalid` / `error` must never be treated as empty — overwriting would
 * destroy account resumes (issue #43).
 */
export type CloudFetchResult =
  | { status: "missing" }
  | { status: "ok"; data: StoreState }
  | { status: "invalid"; reason: string }
  | { status: "error"; message: string };

/** Interpret a Firestore snapshot without performing I/O (testable). */
export function interpretCloudSnapshot(snapshot: {
  exists: () => boolean;
  data: () => unknown;
}): Exclude<CloudFetchResult, { status: "error" }> {
  if (!snapshot.exists()) return { status: "missing" };
  const parsed = parseCloudStoreData(snapshot.data());
  if (parsed) return { status: "ok", data: parsed };
  return {
    status: "invalid",
    reason:
      "Your account resumes could not be read (unexpected data format). Sync is paused so nothing is overwritten.",
  };
}

export function cloudFetchFailure(err: unknown): CloudFetchResult {
  const message =
    err instanceof Error
      ? err.message
      : "Could not reach cloud storage.";
  return {
    status: "error",
    message: `Cloud sync paused: ${message}. Your local resumes are unchanged.`,
  };
}

export async function fetchCloudStore(uid: string): Promise<CloudFetchResult> {
  try {
    const snapshot = await getDoc(userDocRef(uid));
    return interpretCloudSnapshot(snapshot);
  } catch (err) {
    return cloudFetchFailure(err);
  }
}

type CloudWriter = (uid: string, state: StoreState) => Promise<void>;

type Waiter = {
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

/**
 * Per-uid save queue. At most one Firestore write runs at a time; further
 * calls coalesce to the latest StoreState and share one follow-up write.
 * That way a slow older setDoc cannot complete after a newer one and
 * overwrite fresher cloud data (issue #58).
 */
type UidSaveQueue = {
  busy: boolean;
  pending: StoreState | null;
  pendingWaiters: Waiter[];
};

function createUidQueues() {
  return new Map<string, UidSaveQueue>();
}

let uidQueues = createUidQueues();

/** Clears in-memory save queues. For tests only. */
export function resetCloudSaveQueuesForTests(): void {
  uidQueues = createUidQueues();
}

async function defaultWriteCloudStore(
  uid: string,
  state: StoreState
): Promise<void> {
  await setDoc(userDocRef(uid), {
    activeVersionId: state.activeVersionId,
    versions: state.versions,
    updatedAt: new Date().toISOString(),
  });
}

function getQueue(uid: string): UidSaveQueue {
  let queue = uidQueues.get(uid);
  if (!queue) {
    queue = { busy: false, pending: null, pendingWaiters: [] };
    uidQueues.set(uid, queue);
  }
  return queue;
}

/**
 * Take the latest pending state and its waiters, folding any states that
 * arrive synchronously while we are preparing the write.
 */
function takeLatestJob(queue: UidSaveQueue): {
  state: StoreState;
  waiters: Waiter[];
} | null {
  if (queue.pending === null) return null;

  let state = queue.pending;
  const waiters = [...queue.pendingWaiters];
  queue.pending = null;
  queue.pendingWaiters = [];

  while (queue.pending !== null) {
    state = queue.pending;
    waiters.push(...queue.pendingWaiters);
    queue.pending = null;
    queue.pendingWaiters = [];
  }

  return { state, waiters };
}

async function pumpQueue(uid: string, write: CloudWriter): Promise<void> {
  const queue = getQueue(uid);

  try {
    while (true) {
      const job = takeLatestJob(queue);
      if (!job) break;

      try {
        await write(uid, job.state);
        for (const waiter of job.waiters) waiter.resolve();
      } catch (err) {
        for (const waiter of job.waiters) waiter.reject(err);
        // Keep draining so a newer coalesced save after a failure still runs.
      }
    }
  } finally {
    queue.busy = false;
    // A save may have landed between the last empty take and busy=false.
    if (queue.pending !== null) {
      queue.busy = true;
      void pumpQueue(uid, write);
    }
  }
}

/**
 * Build a saveCloudStore that uses `write` for persistence.
 * Exported so tests can inject a controllable writer.
 */
export function createSaveCloudStore(write: CloudWriter) {
  return function saveCloudStore(
    uid: string,
    state: StoreState
  ): Promise<void> {
    const queue = getQueue(uid);
    queue.pending = state;

    const promise = new Promise<void>((resolve, reject) => {
      queue.pendingWaiters.push({ resolve, reject });
    });

    if (!queue.busy) {
      queue.busy = true;
      void pumpQueue(uid, write);
    }

    return promise;
  };
}

export const saveCloudStore = createSaveCloudStore(defaultWriteCloudStore);
