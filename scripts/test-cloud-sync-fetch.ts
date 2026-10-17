/**
 * Regression tests for cloud fetch / initial-sync safety (issue #43).
 * Missing docs may seed from local; parse/network failures must never overwrite.
 *
 * Run: npx tsx scripts/test-cloud-sync-fetch.ts
 *  or: npm run test:cloud-sync-fetch
 */
import assert from "node:assert/strict";
import {
  cloudFetchFailure,
  interpretCloudSnapshot,
  type CloudFetchResult,
} from "../lib/cloud-sync";
import { parseCloudStoreData } from "../lib/cloud-store-parse";
import { planInitialCloudSync } from "../lib/cloud-sync-lifecycle";
import { createEmptyVersion, type StoreState } from "../lib/schema";

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

function localStore(label = "local-v1"): StoreState {
  const version = createEmptyVersion(label);
  return { activeVersionId: version.id, versions: [version] };
}

function snapshot(exists: boolean, data?: unknown) {
  return {
    exists: () => exists,
    data: () => data,
  };
}

/** Simulate the overwrite decision CloudSyncManager used to make incorrectly. */
function wouldOverwriteCloud(plan: ReturnType<typeof planInitialCloudSync>): boolean {
  return plan.action === "seed-local";
}

async function main() {
  await test("missing doc => seed from local (only safe overwrite case)", () => {
    const fetch: CloudFetchResult = { status: "missing" };
    const local = localStore();
    const plan = planInitialCloudSync(fetch, local);
    assert.equal(plan.action, "seed-local");
    assert.equal(wouldOverwriteCloud(plan), true);
    assert.deepEqual(interpretCloudSnapshot(snapshot(false)), {
      status: "missing",
    });
  });

  await test("invalid / unreadable schema => no overwrite", () => {
    const fetch = interpretCloudSnapshot(
      snapshot(true, { activeVersionId: 123, versions: "nope" })
    );
    assert.equal(fetch.status, "invalid");
    const plan = planInitialCloudSync(fetch, localStore());
    assert.equal(plan.action, "block");
    assert.equal(plan.reason, "invalid");
    assert.equal(wouldOverwriteCloud(plan), false);
  });

  await test("corrupt versions that cannot be recovered => no overwrite", () => {
    const fetch = interpretCloudSnapshot(
      snapshot(true, {
        activeVersionId: "x",
        versions: [{ totally: "broken" }, null, 42],
      })
    );
    assert.equal(fetch.status, "invalid");
    assert.equal(
      wouldOverwriteCloud(planInitialCloudSync(fetch, localStore())),
      false
    );
  });

  await test("network / permission error => no overwrite", () => {
    const fetch = cloudFetchFailure(new Error("permission-denied"));
    assert.equal(fetch.status, "error");
    const plan = planInitialCloudSync(fetch, localStore());
    assert.equal(plan.action, "block");
    assert.equal(plan.reason, "error");
    assert.equal(wouldOverwriteCloud(plan), false);
  });

  await test("generic thrown value still blocks writes", () => {
    const fetch = cloudFetchFailure("offline");
    assert.equal(fetch.status, "error");
    assert.equal(
      wouldOverwriteCloud(planInitialCloudSync(fetch, localStore())),
      false
    );
  });

  await test("valid doc => adopt cloud when local is untouched seed / in sync", () => {
    const cloud = localStore("cloud-resume");
    const fetch: CloudFetchResult = { status: "ok", data: cloud };
    // Fresh local with different content => conflict, not seed
    const conflictPlan = planInitialCloudSync(fetch, localStore("device"));
    assert.equal(conflictPlan.action, "conflict");
    assert.equal(wouldOverwriteCloud(conflictPlan), false);

    // Same content => adopt
    const adoptPlan = planInitialCloudSync(fetch, {
      activeVersionId: cloud.activeVersionId,
      versions: cloud.versions.map((v) => ({ ...v })),
    });
    assert.equal(adoptPlan.action, "adopt-cloud");
    if (adoptPlan.action === "adopt-cloud") {
      assert.equal(adoptPlan.cloud.activeVersionId, cloud.activeVersionId);
    }
  });

  await test("older recoverable schema migrates instead of failing", () => {
    const base = createEmptyVersion("legacy");
    // Strip fields that were added later; parser should fill defaults.
    const legacy = {
      activeVersionId: base.id,
      versions: [
        {
          id: base.id,
          name: base.name,
          updatedAt: base.updatedAt,
          templateId: "classic",
          contact: {
            fullName: "Ada",
            email: "ada@example.com",
            phone: "",
            location: "",
            // headline / website omitted — older format
          },
          summary: "PM",
          experience: [],
          skillGroups: [],
          education: [
            {
              id: "edu-1",
              institution: "MIT",
              location: "Cambridge",
              details: "SB",
              // graduationDate omitted
            },
          ],
          // design, sectionOrder, customSections, jobDescription, ai* omitted
        },
      ],
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const parsed = parseCloudStoreData(legacy);
    assert.ok(parsed, "legacy payload should migrate");
    assert.equal(parsed!.versions.length, 1);
    assert.equal(parsed!.versions[0].contact.headline, "");
    assert.equal(parsed!.versions[0].education[0].graduationDate, "");
    assert.ok(parsed!.versions[0].design);
    assert.ok(parsed!.versions[0].sectionOrder.length > 0);

    const fetch = interpretCloudSnapshot(snapshot(true, legacy));
    assert.equal(fetch.status, "ok");
    assert.equal(
      wouldOverwriteCloud(planInitialCloudSync(fetch, localStore())),
      false
    );
  });

  await test("partially recoverable versions keep good entries (no wipe)", () => {
    const good = createEmptyVersion("keep-me");
    const parsed = parseCloudStoreData({
      activeVersionId: "gone",
      versions: [{ broken: true }, good],
    });
    assert.ok(parsed);
    assert.equal(parsed!.versions.length, 1);
    assert.equal(parsed!.versions[0].id, good.id);
    assert.equal(parsed!.activeVersionId, good.id);
  });

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log("\nAll cloud-sync fetch safety tests passed.");
}

void main();
