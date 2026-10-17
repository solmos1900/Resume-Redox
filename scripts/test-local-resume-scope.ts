/**
 * Regression tests for uid-scoped local resume persistence (issue #76).
 *
 * Covers: account A → sign out → account B must not upload/surface A's
 * resumes; same user re-signing in still sees their data; legacy unscoped
 * key is not silently handed to the next account; guest-authored work can
 * still sync on first sign-in.
 *
 * Run: npx tsx scripts/test-local-resume-scope.ts
 *  or: npm run test:local-resume-scope
 */
import assert from "node:assert/strict";
import {
  GUEST_RESUME_STORAGE_KEY,
  LEGACY_RESUME_STORAGE_KEY,
  canAutoAdoptGuestForUid,
  decideLocalScope,
  defaultGuestMeta,
  guestMetaAfterScopeSwitch,
  isUntouchedSeedState,
  maySilentUploadToEmptyCloud,
  parseUidFromResumeStorageKey,
  planLegacyMigration,
  serializePersistEnvelope,
  uidResumeStorageKey,
  type GuestScopeMeta,
} from "../lib/local-resume-scope";
import { createInitialStore, SEED_VERSION_ID } from "../lib/seed-data";
import type { StoreState } from "../lib/schema";

let failed = 0;

function pass(name: string) {
  console.log(`PASS ${name}`);
}

function fail(name: string, err: unknown) {
  failed += 1;
  console.error(`FAIL ${name}:`, err);
}

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

function resume(label: string, uidTag?: string): StoreState {
  const id = `resume-${label}`;
  return {
    activeVersionId: id,
    versions: [
      {
        ...createInitialStore().versions[0],
        id,
        name: label,
        updatedAt: "2026-01-01T00:00:00.000Z",
        contact: {
          ...createInitialStore().versions[0].contact,
          fullName: uidTag ? `${label} (${uidTag})` : label,
        },
      },
    ],
  };
}

function seed(): StoreState {
  return createInitialStore();
}

async function main() {
  await test("storage key helpers", () => {
    assert.equal(uidResumeStorageKey("abc"), "resume-redox-storage:uid:abc");
    assert.equal(parseUidFromResumeStorageKey(GUEST_RESUME_STORAGE_KEY), null);
    assert.equal(
      parseUidFromResumeStorageKey(uidResumeStorageKey("user-a")),
      "user-a"
    );
    assert.equal(parseUidFromResumeStorageKey(LEGACY_RESUME_STORAGE_KEY), null);
    assert.ok(isUntouchedSeedState(seed()));
    assert.equal(seed().versions[0].id, SEED_VERSION_ID);
  });

  await test("guest authored while signed out can auto-adopt for any uid", () => {
    const meta = defaultGuestMeta();
    assert.equal(canAutoAdoptGuestForUid(meta, "user-a"), true);
    assert.equal(canAutoAdoptGuestForUid(meta, "user-b"), true);
  });

  await test("guest copied from A is only auto-adoptable by A", () => {
    const meta: GuestScopeMeta = {
      guestCopiedFromUid: "user-a",
      guestUntrusted: false,
    };
    assert.equal(canAutoAdoptGuestForUid(meta, "user-a"), true);
    assert.equal(canAutoAdoptGuestForUid(meta, "user-b"), false);
  });

  await test("untrusted legacy guest is never auto-adoptable", () => {
    const meta: GuestScopeMeta = {
      guestCopiedFromUid: null,
      guestUntrusted: true,
    };
    assert.equal(canAutoAdoptGuestForUid(meta, "user-a"), false);
  });

  await test("A → sign out → B: B does not receive A's resumes for upload", () => {
    const aResumes = resume("Alice PM", "A");
    const metaAfterASignOut: GuestScopeMeta = {
      guestCopiedFromUid: "user-a",
      guestUntrusted: false,
    };

    // Sign out of A: guest gets A's live state
    const signedOut = decideLocalScope({
      nextUid: null,
      previousPersistKey: uidResumeStorageKey("user-a"),
      liveState: aResumes,
      guestState: seed(),
      uidState: null,
      meta: defaultGuestMeta(),
    });
    assert.equal(signedOut.persistKey, GUEST_RESUME_STORAGE_KEY);
    assert.equal(signedOut.state.versions[0]?.name, "Alice PM");
    assert.equal(signedOut.trustForUpload, false);

    const meta = guestMetaAfterScopeSwitch({
      nextUid: null,
      previousPersistKey: uidResumeStorageKey("user-a"),
      previousMeta: defaultGuestMeta(),
    });
    assert.deepEqual(meta, metaAfterASignOut);

    // Sign in as B with empty uid bucket: foreign guest must be ignored
    const asB = decideLocalScope({
      nextUid: "user-b",
      previousPersistKey: GUEST_RESUME_STORAGE_KEY,
      liveState: aResumes,
      guestState: aResumes,
      uidState: null,
      meta: metaAfterASignOut,
    });
    assert.equal(asB.persistKey, uidResumeStorageKey("user-b"));
    assert.ok(isUntouchedSeedState(asB.state), "B must not load A's resumes");
    assert.equal(asB.trustForUpload, false);
    assert.equal(asB.pendingAdoptLocal, null);
    assert.equal(
      maySilentUploadToEmptyCloud({
        local: asB.state,
        trustForUpload: asB.trustForUpload,
      }),
      true,
      "seed may bootstrap empty cloud without leaking A"
    );
    assert.notEqual(asB.state.versions[0]?.name, "Alice PM");
  });

  await test("same user re-sign-in prefers guest continuation (device edits)", () => {
    const aCloudish = resume("Alice v1", "A");
    const aGuestEdits = resume("Alice v2 device", "A");
    const meta: GuestScopeMeta = {
      guestCopiedFromUid: "user-a",
      guestUntrusted: false,
    };

    const again = decideLocalScope({
      nextUid: "user-a",
      previousPersistKey: GUEST_RESUME_STORAGE_KEY,
      liveState: aGuestEdits,
      guestState: aGuestEdits,
      uidState: aCloudish,
      meta,
    });
    assert.equal(again.state.versions[0]?.name, "Alice v2 device");
    assert.equal(again.trustForUpload, true);
    assert.equal(again.pendingAdoptLocal, null);
  });

  await test("first-time guest → sign-in with empty uid adopts guest", () => {
    const guestWork = resume("My first resume");
    const decided = decideLocalScope({
      nextUid: "new-user",
      previousPersistKey: GUEST_RESUME_STORAGE_KEY,
      liveState: guestWork,
      guestState: guestWork,
      uidState: null,
      meta: defaultGuestMeta(),
    });
    assert.equal(decided.state.versions[0]?.name, "My first resume");
    assert.equal(decided.trustForUpload, true);
    assert.equal(
      maySilentUploadToEmptyCloud({
        local: decided.state,
        trustForUpload: decided.trustForUpload,
      }),
      true
    );
  });

  await test("legacy unscoped key migrates to guest as untrusted", () => {
    const legacy = resume("Legacy resume");
    const plan = planLegacyMigration({
      legacyRaw: serializePersistEnvelope(legacy),
      guestRaw: null,
    });
    assert.equal(plan.migrate, true);
    assert.equal(plan.removeLegacy, true);
    assert.equal(plan.guestState?.versions[0]?.name, "Legacy resume");
    assert.equal(plan.meta.guestUntrusted, true);
    assert.equal(plan.meta.guestCopiedFromUid, null);
  });

  await test("legacy guest requires explicit adopt; not silent upload", () => {
    const legacy = resume("Legacy resume");
    const decided = decideLocalScope({
      nextUid: "user-x",
      previousPersistKey: GUEST_RESUME_STORAGE_KEY,
      liveState: seed(),
      guestState: legacy,
      uidState: null,
      meta: { guestCopiedFromUid: null, guestUntrusted: true },
    });
    assert.ok(isUntouchedSeedState(decided.state));
    assert.equal(decided.trustForUpload, false);
    assert.equal(decided.pendingAdoptLocal?.versions[0]?.name, "Legacy resume");
    assert.equal(
      maySilentUploadToEmptyCloud({
        local: decided.pendingAdoptLocal!,
        trustForUpload: decided.trustForUpload,
      }),
      false
    );
  });

  await test("B with own uid data ignores A's guest copy", () => {
    const aResumes = resume("Alice", "A");
    const bResumes = resume("Bob", "B");
    const decided = decideLocalScope({
      nextUid: "user-b",
      previousPersistKey: GUEST_RESUME_STORAGE_KEY,
      liveState: aResumes,
      guestState: aResumes,
      uidState: bResumes,
      meta: { guestCopiedFromUid: "user-a", guestUntrusted: false },
    });
    assert.equal(decided.state.versions[0]?.name, "Bob");
    assert.equal(decided.trustForUpload, true);
    assert.equal(decided.pendingAdoptLocal, null);
  });

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log("\nAll local-resume-scope tests passed.");
}

void main();
