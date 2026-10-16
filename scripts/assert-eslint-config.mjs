#!/usr/bin/env node
/**
 * Regression check for issue #46: lint must have a committed ESLint config
 * so `next lint` never falls back to an interactive setup prompt.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const configCandidates = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "eslint.config.mts",
  "eslint.config.cts",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.yaml",
  ".eslintrc.yml",
  ".eslintrc.json",
  ".eslintrc",
];

const found = configCandidates.filter((name) => existsSync(join(root, name)));

if (found.length === 0) {
  console.error(
    "assert-eslint-config: no ESLint config found at repo root.\n" +
      "Commit an eslint.config.* (or .eslintrc*) so `npm run lint` is non-interactive.",
  );
  process.exit(1);
}

console.log(`assert-eslint-config: found ${found.join(", ")}`);

const result = spawnSync("npm", ["run", "lint"], {
  cwd: root,
  env: { ...process.env, CI: "1" },
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;

if (/How would you like to configure ESLint/i.test(combined)) {
  console.error(
    "assert-eslint-config: `npm run lint` prompted for interactive ESLint setup.\n" +
      "The committed config is missing or not detected by next lint.",
  );
  process.exit(1);
}

if (result.status !== 0 && result.status !== null) {
  // Real lint findings are OK for this assertion; interactive setup is not.
  // Exit 0 only when lint ran without prompting. Surface lint exit code so
  // callers that want a clean tree can run `npm run lint` separately.
  console.log(
    "assert-eslint-config: lint ran non-interactively (exit " +
      result.status +
      ").",
  );
  process.exit(0);
}

console.log("assert-eslint-config: lint ran non-interactively and passed.");
process.exit(0);
