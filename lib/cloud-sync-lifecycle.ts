/**
 * Helpers for cloud-sync session lifecycle.
 *
 * Initial pull/merge must key off the Firebase uid — not the User object
 * reference. Signup updates displayName by replacing the user object in
 * React state; that must not restart sync mid-edit.
 */

import type { StoreState } from "./schema";

/** Mirrors CloudFetchResult in cloud-sync.ts (kept local to avoid a cycle). */
type CloudFetchResult =
  | { status: "missing" }
  | { status: "ok"; data: StoreState }
  | { status: "invalid"; reason: string }
  | { status: "error"; message: string };

/** Stable session key for initial cloud sync. Null means signed out. */
export function cloudSyncSessionKey(
  user: { uid: string } | null | undefined
): string | null {
  return user?.uid ?? null;
}

/**
 * Whether the sync effect should tear down the previous session and run
 * initial pull/merge again. Same-uid profile updates return false.
 */
export function shouldReinitializeCloudSync(
  previousKey: string | null,
  nextKey: string | null
): boolean {
  return previousKey !== nextKey;
}

/** Clear a pending debounced cloud save; returns null for the timer ref. */
export function clearSaveDebounceTimer(
  timeoutId: number | null,
  clearTimeoutFn: (id: number) => void = clearTimeout as (id: number) => void
): null {
  if (timeoutId != null) clearTimeoutFn(timeoutId);
  return null;
}

const SEED_VERSION_ID = "seed-technical-pm";

/** True when local still holds only the stock seed resume. */
export function isUntouchedSeed(state: StoreState): boolean {
  return (
    state.versions.length === 1 && state.versions[0].id === SEED_VERSION_ID
  );
}

/**
 * True when local and cloud hold the same resumes (by id + last-edited
 * time), regardless of array order.
 */
export function storesAreInSync(a: StoreState, b: StoreState): boolean {
  if (a.versions.length !== b.versions.length) return false;
  const bById = new Map(b.versions.map((v) => [v.id, v.updatedAt]));
  return a.versions.every((v) => bById.get(v.id) === v.updatedAt);
}

/**
 * What the client should do after the initial cloud read.
 * Only `seed-local` may write local state to the cloud — and only when the
 * document is authoritatively missing (issue #43).
 */
export type InitialSyncPlan =
  | { action: "seed-local" }
  | { action: "adopt-cloud"; cloud: StoreState }
  | { action: "conflict"; cloud: StoreState; local: StoreState }
  | {
      action: "block";
      reason: "invalid" | "error";
      message: string;
    };

export function planInitialCloudSync(
  fetch: CloudFetchResult,
  local: StoreState
): InitialSyncPlan {
  if (fetch.status === "missing") {
    return { action: "seed-local" };
  }

  if (fetch.status === "invalid" || fetch.status === "error") {
    return {
      action: "block",
      reason: fetch.status,
      message: fetch.status === "invalid" ? fetch.reason : fetch.message,
    };
  }

  const cloud = fetch.data;
  if (isUntouchedSeed(local) || storesAreInSync(local, cloud)) {
    return { action: "adopt-cloud", cloud };
  }

  return { action: "conflict", cloud, local };
}
