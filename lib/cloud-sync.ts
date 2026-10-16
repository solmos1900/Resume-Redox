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
