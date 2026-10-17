/**
 * Local resume persistence scoped by auth identity.
 *
 * Why: a single shared Zustand persist key meant User A's resumes could stay
 * in memory / localStorage after sign-out and upload into User B's cloud on
 * the next sign-in (issue #76).
 *
 * Model:
 * - Guest (signed out): `resume-redox-storage:guest`
 * - Account: `resume-redox-storage:uid:<firebaseUid>`
 * - Legacy unscoped `resume-redox-storage` migrates once into the guest bucket
 *   marked untrusted — never silently uploaded to whichever account signs in.
 *
 * Signed-out editing (product: local-first, account optional):
 * - Guests keep editing in the guest bucket.
 * - On sign-out, the current account snapshot is copied into guest so
 *   "resumes stay on this device", tagged with `guestCopiedFromUid`.
 * - On sign-in, only guest data that is auto-adoptable for that uid (authored
 *   while signed out, or copied from the same uid) may become local for sync.
 * - Guest data copied from a *different* uid is ignored for the new session.
 */

import type { StoreState } from "./schema";
import { SEED_VERSION_ID, createInitialStore } from "./seed-data";

export const LEGACY_RESUME_STORAGE_KEY = "resume-redox-storage";
export const GUEST_RESUME_STORAGE_KEY = "resume-redox-storage:guest";
export const RESUME_SCOPE_META_KEY = "resume-redox-scope-meta";
export const RESUME_PERSIST_VERSION = 8;

const UID_KEY_PREFIX = "resume-redox-storage:uid:";

export type GuestScopeMeta = {
  /** Set when guest was filled from an account on sign-out. */
  guestCopiedFromUid: string | null;
  /**
   * True when guest came from the pre-scoping legacy key (ownership unknown).
   * Must not be silently uploaded; requires an explicit "keep this device" choice.
   */
  guestUntrusted: boolean;
};

export type LocalScopeDecision = {
  /** Persist key the in-memory store should use after the switch. */
  persistKey: string;
  /**
   * Snapshot to load into the Zustand store / uid bucket.
   * Never includes untrusted legacy data — that stays in `pendingAdoptLocal`
   * until the user explicitly keeps it.
   */
  state: StoreState;
  /**
   * When true, CloudSyncManager may call saveCloudStore with this local state
   * without an explicit conflict/adopt confirmation.
   */
  trustForUpload: boolean;
  /**
   * When set, show the keep-local / use-account dialog for this snapshot
   * (legacy untrusted guest) even if the cloud document is missing. Not
   * written to the uid bucket until the user confirms.
   */
  pendingAdoptLocal: StoreState | null;
};

export function uidResumeStorageKey(uid: string): string {
  return `${UID_KEY_PREFIX}${uid}`;
}

export function parseUidFromResumeStorageKey(
  key: string | undefined | null
): string | null {
  if (!key || !key.startsWith(UID_KEY_PREFIX)) return null;
  const uid = key.slice(UID_KEY_PREFIX.length);
  return uid.length > 0 ? uid : null;
}

export function defaultGuestMeta(): GuestScopeMeta {
  return { guestCopiedFromUid: null, guestUntrusted: false };
}

export function isUntouchedSeedState(state: StoreState): boolean {
  return (
    state.versions.length === 1 && state.versions[0]?.id === SEED_VERSION_ID
  );
}

export function toStoreState(state: {
  activeVersionId: string;
  versions: StoreState["versions"];
}): StoreState {
  return {
    activeVersionId: state.activeVersionId,
    versions: state.versions,
  };
}

/** Guest may be auto-adopted into this uid's local session (and uploaded). */
export function canAutoAdoptGuestForUid(
  meta: GuestScopeMeta,
  uid: string
): boolean {
  if (meta.guestUntrusted) return false;
  if (meta.guestCopiedFromUid == null) return true;
  return meta.guestCopiedFromUid === uid;
}

/**
 * Pure decision for which local snapshot applies after an auth identity change.
 * Callers own reading/writing localStorage and applying the result to Zustand.
 */
export function decideLocalScope(input: {
  nextUid: string | null;
  previousPersistKey: string | null | undefined;
  liveState: StoreState;
  guestState: StoreState | null;
  uidState: StoreState | null;
  meta: GuestScopeMeta;
}): LocalScopeDecision {
  const {
    nextUid,
    previousPersistKey,
    liveState,
    guestState,
    uidState,
    meta,
  } = input;
  const previousUid = parseUidFromResumeStorageKey(previousPersistKey);

  // Signed out → guest bucket. If we just left an account, prefer the live
  // snapshot (includes unsaved-to-guest edits) as the on-device continuation.
  if (nextUid == null) {
    const fromAccount = previousUid != null;
    const state = fromAccount
      ? liveState
      : guestState && !isUntouchedSeedState(guestState)
        ? guestState
        : liveState;
    return {
      persistKey: GUEST_RESUME_STORAGE_KEY,
      state,
      trustForUpload: false,
      pendingAdoptLocal: null,
    };
  }

  // Signed in → uid bucket, optionally adopting guest.
  const seed = createInitialStore();
  const base = uidState && !isUntouchedSeedState(uidState) ? uidState : seed;
  const guest = guestState && !isUntouchedSeedState(guestState) ? guestState : null;

  if (guest && canAutoAdoptGuestForUid(meta, nextUid)) {
    // Same user after sign-out: guest is the device continuation — prefer it.
    // First-time guest→account: adopt guest into this uid when uid bucket empty.
    if (meta.guestCopiedFromUid === nextUid || isUntouchedSeedState(base)) {
      return {
        persistKey: uidResumeStorageKey(nextUid),
        state: guest,
        trustForUpload: true,
        pendingAdoptLocal: null,
      };
    }
  }

  if (guest && meta.guestUntrusted && isUntouchedSeedState(base)) {
    return {
      persistKey: uidResumeStorageKey(nextUid),
      state: seed,
      trustForUpload: false,
      pendingAdoptLocal: guest,
    };
  }

  // Foreign guest (copiedFromUid !== nextUid) is intentionally ignored.
  return {
    persistKey: uidResumeStorageKey(nextUid),
    state: base,
    trustForUpload: !isUntouchedSeedState(base),
    pendingAdoptLocal: null,
  };
}

/**
 * Meta to write when entering the guest scope after decideLocalScope.
 * When leaving an account, tag guest with that uid so another account cannot
 * auto-adopt it later.
 */
export function guestMetaAfterScopeSwitch(input: {
  nextUid: string | null;
  previousPersistKey: string | null | undefined;
  previousMeta: GuestScopeMeta;
}): GuestScopeMeta {
  const previousUid = parseUidFromResumeStorageKey(input.previousPersistKey);
  if (input.nextUid == null && previousUid != null) {
    return { guestCopiedFromUid: previousUid, guestUntrusted: false };
  }
  if (input.nextUid != null) {
    // After a successful trusted adopt, clear untrusted / foreign tags so the
    // guest bucket does not keep poisoning later sessions. Callers that only
    // *considered* guest without adopting should pass through previousMeta
    // via apply path — this helper is for writes that replace guest content.
    return defaultGuestMeta();
  }
  return input.previousMeta;
}

/** Whether CloudSyncManager may silently upload local to an empty cloud doc. */
export function maySilentUploadToEmptyCloud(input: {
  local: StoreState;
  trustForUpload: boolean;
}): boolean {
  if (isUntouchedSeedState(input.local)) return true;
  return input.trustForUpload;
}

export type PersistEnvelope = {
  state: StoreState;
  version: number;
};

export function parsePersistEnvelope(raw: string | null): StoreState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: StoreState };
    if (
      parsed?.state &&
      typeof parsed.state.activeVersionId === "string" &&
      Array.isArray(parsed.state.versions)
    ) {
      return {
        activeVersionId: parsed.state.activeVersionId,
        versions: parsed.state.versions,
      };
    }
  } catch {
    /* ignore corrupt */
  }
  return null;
}

export function serializePersistEnvelope(state: StoreState): string {
  const envelope: PersistEnvelope = {
    state: toStoreState(state),
    version: RESUME_PERSIST_VERSION,
  };
  return JSON.stringify(envelope);
}

export function parseGuestMeta(raw: string | null): GuestScopeMeta {
  if (!raw) return defaultGuestMeta();
  try {
    const parsed = JSON.parse(raw) as Partial<GuestScopeMeta>;
    return {
      guestCopiedFromUid:
        typeof parsed.guestCopiedFromUid === "string"
          ? parsed.guestCopiedFromUid
          : parsed.guestCopiedFromUid === null
            ? null
            : null,
      guestUntrusted: Boolean(parsed.guestUntrusted),
    };
  } catch {
    return defaultGuestMeta();
  }
}

/**
 * One-time move of the legacy unscoped key into the guest bucket.
 * Marks guest untrusted so it is never silently uploaded.
 * Returns whether a migration write is needed.
 */
export function planLegacyMigration(input: {
  legacyRaw: string | null;
  guestRaw: string | null;
}): {
  migrate: boolean;
  guestState: StoreState | null;
  meta: GuestScopeMeta;
  removeLegacy: boolean;
} {
  const legacy = parsePersistEnvelope(input.legacyRaw);
  if (!legacy) {
    return {
      migrate: false,
      guestState: parsePersistEnvelope(input.guestRaw),
      meta: defaultGuestMeta(),
      removeLegacy: Boolean(input.legacyRaw),
    };
  }

  const existingGuest = parsePersistEnvelope(input.guestRaw);
  // Prefer existing guest if it already has real data; still drop legacy.
  if (existingGuest && !isUntouchedSeedState(existingGuest)) {
    return {
      migrate: false,
      guestState: existingGuest,
      meta: defaultGuestMeta(),
      removeLegacy: true,
    };
  }

  return {
    migrate: true,
    guestState: legacy,
    meta: { guestCopiedFromUid: null, guestUntrusted: true },
    removeLegacy: true,
  };
}
