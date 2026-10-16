/**
 * Regression guard: fail if the resolved Next.js version is below the
 * patched floor required by current Next 15.5.x security advisories
 * (e.g. GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4, September 2026 release).
 *
 * Run: npm run test:next-version
 */
import { createRequire } from "node:module";

const MIN_NEXT = "15.5.27";

function parseSemver(version) {
  const match = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Unrecognized Next.js version: ${version}`);
  }
  return match.slice(1).map(Number);
}

function isBelow(actual, minimum) {
  const a = parseSemver(actual);
  const m = parseSemver(minimum);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] < m[i]) return true;
    if (a[i] > m[i]) return false;
  }
  return false;
}

const require = createRequire(import.meta.url);
const { version } = require("next/package.json");

if (isBelow(version, MIN_NEXT)) {
  console.error(
    `FAIL next@${version} is below patched floor ${MIN_NEXT} (RCE/DoS advisories).`
  );
  process.exit(1);
}

console.log(`PASS next@${version} meets patched floor >=${MIN_NEXT}`);
