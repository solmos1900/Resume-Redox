/**
 * Browser-side apply of local resume scope decisions (localStorage + Zustand).
 * Kept separate from the pure decision helpers so those stay easy to unit-test.
 */

import { createJSONStorage } from "zustand/middleware";
import { useResumeStore } from "./store";
import { createInitialStore } from "./seed-data";
import {
  GUEST_RESUME_STORAGE_KEY,
  LEGACY_RESUME_STORAGE_KEY,
  RESUME_SCOPE_META_KEY,
  decideLocalScope,
  defaultGuestMeta,
  guestMetaAfterScopeSwitch,
  isUntouchedSeedState,
  parseGuestMeta,
  parsePersistEnvelope,
  parseUidFromResumeStorageKey,
  planLegacyMigration,
  serializePersistEnvelope,
  toStoreState,
  uidResumeStorageKey,
  type GuestScopeMeta,
  type LocalScopeDecision,
} from "./local-resume-scope";
import type { StoreState } from "./schema";

export type AppliedLocalScope = LocalScopeDecision & {
  meta: GuestScopeMeta;
};

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readMeta(storage: Storage): GuestScopeMeta {
  return parseGuestMeta(storage.getItem(RESUME_SCOPE_META_KEY));
}

function writeMeta(storage: Storage, meta: GuestScopeMeta): void {
  storage.setItem(RESUME_SCOPE_META_KEY, JSON.stringify(meta));
}

function readState(storage: Storage, key: string): StoreState | null {
  return parsePersistEnvelope(storage.getItem(key));
}

function writeState(storage: Storage, key: string, state: StoreState): void {
  storage.setItem(key, serializePersistEnvelope(toStoreState(state)));
}

function storeStatesEqual(a: StoreState, b: StoreState): boolean {
  if (a.activeVersionId !== b.activeVersionId) return false;
  if (a.versions.length !== b.versions.length) return false;
  return a.versions.every(
    (v, i) =>
      v.id === b.versions[i]?.id && v.updatedAt === b.versions[i]?.updatedAt
  );
}

/** Move legacy unscoped key into guest (untrusted) once. */
export function migrateLegacyResumeStorage(): void {
  const storage = browserStorage();
  if (!storage) return;

  const plan = planLegacyMigration({
    legacyRaw: storage.getItem(LEGACY_RESUME_STORAGE_KEY),
    guestRaw: storage.getItem(GUEST_RESUME_STORAGE_KEY),
  });

  if (plan.migrate && plan.guestState) {
    writeState(storage, GUEST_RESUME_STORAGE_KEY, plan.guestState);
    writeMeta(storage, plan.meta);
  }

  if (plan.removeLegacy) {
    storage.removeItem(LEGACY_RESUME_STORAGE_KEY);
  }
}

/**
 * Switch the resume persist key to match `nextUid` (null = guest) and load the
 * correct snapshot into the Zustand store. Returns trust flags for cloud sync.
 */
export async function applyLocalResumeScope(
  nextUid: string | null
): Promise<AppliedLocalScope> {
  const storage = browserStorage();
  migrateLegacyResumeStorage();

  const previousPersistKey =
    useResumeStore.persist.getOptions().name ?? GUEST_RESUME_STORAGE_KEY;
  const liveState = toStoreState(useResumeStore.getState());
  const meta = storage ? readMeta(storage) : defaultGuestMeta();
  const guestState = storage
    ? readState(storage, GUEST_RESUME_STORAGE_KEY)
    : null;
  const uidState =
    nextUid && storage ? readState(storage, uidResumeStorageKey(nextUid)) : null;

  // When leaving an account, flush the live snapshot into that uid's key so
  // re-sign-in still has data even if guest is later overwritten.
  const previousUid = parseUidFromResumeStorageKey(previousPersistKey);
  if (storage && nextUid == null && previousUid) {
    writeState(storage, uidResumeStorageKey(previousUid), liveState);
  }

  const decision = decideLocalScope({
    nextUid,
    previousPersistKey,
    liveState,
    guestState,
    uidState,
    meta,
  });

  let nextMeta = meta;

  if (nextUid == null) {
    nextMeta = guestMetaAfterScopeSwitch({
      nextUid,
      previousPersistKey,
      previousMeta: meta,
    });
    if (storage) {
      writeState(storage, GUEST_RESUME_STORAGE_KEY, decision.state);
      writeMeta(storage, nextMeta);
    }
  } else if (decision.trustForUpload) {
    // Persist the trusted snapshot into this uid's bucket. Do not overwrite
    // the guest bucket when it still holds another account's device copy.
    if (storage) {
      writeState(storage, decision.persistKey, decision.state);
    }
    const adoptedFromGuest =
      guestState != null &&
      !isUntouchedSeedState(guestState) &&
      storeStatesEqual(decision.state, guestState);
    if (adoptedFromGuest) {
      nextMeta = {
        guestCopiedFromUid: nextUid,
        guestUntrusted: false,
      };
      if (storage) {
        writeMeta(storage, nextMeta);
      }
    }
  } else if (storage) {
    // Untrusted pending adopt (or foreign guest ignored): do not write
    // foreign/untrusted snapshots into the uid key.
    if (!uidState || isUntouchedSeedState(uidState)) {
      writeState(storage, decision.persistKey, createInitialStore());
    }
  }

  // Reset in-memory to seed before rehydrate so an empty target key cannot
  // merge-keep the previous account's live state (zustand merge returns current).
  useResumeStore.setState(createInitialStore());
  useResumeStore.persist.setOptions({
    name: decision.persistKey,
    storage: createJSONStorage(() => localStorage),
  });
  await Promise.resolve(useResumeStore.persist.rehydrate());

  // Rehydrate of an empty key keeps seed; apply the decided snapshot when it
  // differs (covers sign-out copy and trusted guest adopt).
  const after = toStoreState(useResumeStore.getState());
  if (!storeStatesEqual(after, decision.state)) {
    useResumeStore.setState({
      activeVersionId: decision.state.activeVersionId,
      versions: decision.state.versions,
    });
  }

  return { ...decision, meta: nextMeta };
}

/** Mark current local state as trusted for the signed-in uid (after "keep local"). */
export function markLocalTrustedForUid(uid: string): void {
  const storage = browserStorage();
  const state = toStoreState(useResumeStore.getState());
  if (storage) {
    writeState(storage, uidResumeStorageKey(uid), state);
    writeState(storage, GUEST_RESUME_STORAGE_KEY, state);
    writeMeta(storage, {
      guestCopiedFromUid: uid,
      guestUntrusted: false,
    });
  }
  useResumeStore.persist.setOptions({ name: uidResumeStorageKey(uid) });
}
