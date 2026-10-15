/**
 * Regression tests for cloud-sync session lifecycle (issue #59).
 * Ensures initial sync keys on uid — not User object identity — so email
 * signup displayName updates do not restart sync mid-edit.
 *
 * Run: npx tsx scripts/test-cloud-sync-lifecycle.ts
 *  or: npm run test:cloud-sync-lifecycle
 */
import assert from "node:assert/strict";
import {
  clearSaveDebounceTimer,
  cloudSyncSessionKey,
  shouldReinitializeCloudSync,
} from "../lib/cloud-sync-lifecycle";

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

/** Mirrors CloudSyncManager: count initializations when the session key changes. */
function countInitialSyncRuns(
  userSequence: Array<{ uid: string; displayName?: string } | null>
): number {
  let previousKey: string | null = null;
  let inits = 0;
  for (const user of userSequence) {
    const nextKey = cloudSyncSessionKey(user);
    if (shouldReinitializeCloudSync(previousKey, nextKey)) {
      if (nextKey != null) inits += 1;
      previousKey = nextKey;
    }
  }
  return inits;
}

await test("session key is uid only", () => {
  assert.equal(cloudSyncSessionKey(null), null);
  assert.equal(cloudSyncSessionKey(undefined), null);
  assert.equal(cloudSyncSessionKey({ uid: "abc" }), "abc");
});

await test("same uid keeps one session key across profile-shaped object replaces", () => {
  const beforeSignupProfile = { uid: "user-1" };
  const afterDisplayName = { uid: "user-1", displayName: "Ada Lovelace" };
  assert.equal(
    cloudSyncSessionKey(beforeSignupProfile),
    cloudSyncSessionKey(afterDisplayName)
  );
  assert.equal(
    shouldReinitializeCloudSync(
      cloudSyncSessionKey(beforeSignupProfile),
      cloudSyncSessionKey(afterDisplayName)
    ),
    false
  );
});

await test("initial sync runs once per uid when user object is replaced (signup)", () => {
  const runs = countInitialSyncRuns([
    { uid: "new-user" },
    // AuthProvider previously did setUser({ ...user }) after updateProfile
    { uid: "new-user", displayName: "New User" },
    { uid: "new-user", displayName: "New User" },
  ]);
  assert.equal(runs, 1);
});

await test("genuine account change still re-initializes sync", () => {
  assert.equal(
    shouldReinitializeCloudSync("user-a", "user-b"),
    true
  );
  const runs = countInitialSyncRuns([
    { uid: "user-a" },
    null,
    { uid: "user-b" },
  ]);
  assert.equal(runs, 2);
});

await test("sign-out then same user again re-initializes", () => {
  const runs = countInitialSyncRuns([
    { uid: "user-a" },
    null,
    { uid: "user-a" },
  ]);
  assert.equal(runs, 2);
});

await test("clearSaveDebounceTimer clears pending id and returns null", () => {
  const cleared: number[] = [];
  const result = clearSaveDebounceTimer(42, (id) => {
    cleared.push(id);
  });
  assert.equal(result, null);
  assert.deepEqual(cleared, [42]);
  assert.equal(clearSaveDebounceTimer(null, () => assert.fail("should not clear")), null);
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll cloud-sync lifecycle tests passed.");
