/**
 * Helpers for cloud-sync session lifecycle.
 *
 * Initial pull/merge must key off the Firebase uid — not the User object
 * reference. Signup updates displayName by replacing the user object in
 * React state; that must not restart sync mid-edit.
 */

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
