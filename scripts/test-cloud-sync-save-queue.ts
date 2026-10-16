/**
 * Regression tests for cloud autosave write serialization / coalescing (issue #58).
 * Run: npx tsx scripts/test-cloud-sync-save-queue.ts
 *  or: npm run test:cloud-sync-save-queue
 */
import assert from "node:assert/strict";
import {
  createSaveCloudStore,
  resetCloudSaveQueuesForTests,
} from "../lib/cloud-sync";
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

function store(label: string): StoreState {
  return {
    activeVersionId: label,
    versions: [],
  };
}

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = () => res();
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Flush microtasks so the save pump can schedule the next write. */
async function tick() {
  await Promise.resolve();
  await Promise.resolve();
}

async function main() {
  await test(
    "slower older write cannot overwrite a newer one (serialized)",
    async () => {
      resetCloudSaveQueuesForTests();

      const writes: string[] = [];
      const gates: Array<ReturnType<typeof deferred>> = [];

      const saveCloudStore = createSaveCloudStore(async (_uid, state) => {
        const gate = deferred();
        gates.push(gate);
        writes.push(`start:${state.activeVersionId}`);
        await gate.promise;
        writes.push(`end:${state.activeVersionId}`);
      });

      const first = saveCloudStore("user-1", store("old"));
      await tick();
      assert.equal(gates.length, 1);
      assert.deepEqual(writes, ["start:old"]);

      const second = saveCloudStore("user-1", store("new"));
      await tick();
      assert.equal(gates.length, 1, "newer save must wait for in-flight write");

      gates[0].resolve();
      await first;
      await tick();
      assert.equal(gates.length, 2, "newer save runs only after older completes");
      assert.ok(writes.includes("start:new"));

      gates[1].resolve();
      await second;

      assert.deepEqual(writes, [
        "start:old",
        "end:old",
        "start:new",
        "end:new",
      ]);
      assert.equal(
        writes.filter((w) => w.startsWith("end:")).at(-1),
        "end:new",
        "final completed write must be the newest state"
      );
    }
  );

  await test(
    "rapid overlapping saves coalesce to latest pending state",
    async () => {
      resetCloudSaveQueuesForTests();

      const written: string[] = [];
      const firstWrite = deferred();

      let writeCount = 0;
      const saveCloudStore = createSaveCloudStore(async (_uid, state) => {
        writeCount += 1;
        if (writeCount === 1) {
          await firstWrite.promise;
        }
        written.push(state.activeVersionId);
      });

      const p1 = saveCloudStore("user-1", store("v1"));
      await tick();

      const p2 = saveCloudStore("user-1", store("v2"));
      const p3 = saveCloudStore("user-1", store("v3"));

      firstWrite.resolve();
      await Promise.all([p1, p2, p3]);

      assert.deepEqual(
        written,
        ["v1", "v3"],
        "middle state v2 must be coalesced away; only v1 then latest v3"
      );
      assert.equal(writeCount, 2);
    }
  );

  await test("independent uids do not block each other", async () => {
    resetCloudSaveQueuesForTests();

    const started: string[] = [];
    const gateA = deferred();
    const gateB = deferred();

    const saveCloudStore = createSaveCloudStore(async (uid, state) => {
      started.push(`${uid}:${state.activeVersionId}`);
      if (uid === "a") await gateA.promise;
      else await gateB.promise;
    });

    const pa = saveCloudStore("a", store("1"));
    const pb = saveCloudStore("b", store("1"));
    await tick();

    assert.deepEqual(
      started.sort(),
      ["a:1", "b:1"],
      "different uids may write in parallel"
    );

    gateA.resolve();
    gateB.resolve();
    await Promise.all([pa, pb]);
  });

  await test(
    "coalesced callers reject when the latest write fails",
    async () => {
      resetCloudSaveQueuesForTests();

      let writeCount = 0;
      const firstWrite = deferred();
      const saveCloudStore = createSaveCloudStore(async (_uid, state) => {
        writeCount += 1;
        if (writeCount === 1) {
          await firstWrite.promise;
          return;
        }
        throw new Error(`persist failed for ${state.activeVersionId}`);
      });

      const p1 = saveCloudStore("user-1", store("v1"));
      await tick();
      const p2 = saveCloudStore("user-1", store("v2"));

      firstWrite.resolve();
      await p1;
      await assert.rejects(p2, /persist failed for v2/);
      assert.equal(writeCount, 2);
    }
  );

  await test(
    "without a queue, a slow older write finishing last would win (baseline)",
    async () => {
      // Documents the race that issue #58 describes when writes are fired
      // concurrently with no serialization — contrast with the tests above.
      const cloud: { value: string | null } = { value: null };

      async function naiveSave(label: string, delayMs: number) {
        await new Promise((r) => setTimeout(r, delayMs));
        cloud.value = label;
      }

      await Promise.all([naiveSave("old", 40), naiveSave("new", 5)]);
      assert.equal(
        cloud.value,
        "old",
        "naive parallel writes: slower older completion overwrites newer data"
      );
    }
  );

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }

  console.log("\nAll cloud-sync save queue tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
