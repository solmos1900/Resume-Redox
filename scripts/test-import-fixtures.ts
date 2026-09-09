/**
 * Gregor acceptance: golden fixtures parse usable name/contact/experience bullets.
 * Run: npx tsx scripts/test-import-fixtures.ts
 *  or: npm run test:import-fixtures
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseResumeFile } from "../lib/import/parse-file";
import { summarizeParsedFields } from "../lib/import/build-import-version";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "..", "fixtures", "import");

const cases = [
  {
    file: "jordan-lee-pm.pdf",
    expectName: /Jordan Lee/i,
    expectEmail: /jordan\.lee@example\.com/i,
    minBullets: 4,
  },
  {
    file: "sam-chen-swe.pdf",
    expectName: /Sam Chen/i,
    expectEmail: /sam\.chen@example\.com/i,
    minBullets: 4,
  },
  {
    file: "morgan-patel-tpm.docx",
    expectName: /Morgan Patel/i,
    expectEmail: /morgan\.patel@example\.com/i,
    minBullets: 4,
  },
];

async function main() {
  let failed = 0;

  for (const c of cases) {
    const full = path.join(fixturesDir, c.file);
    if (!fs.existsSync(full)) {
      console.error("FAIL missing fixture:", full);
      failed += 1;
      continue;
    }
    const buffer = fs.readFileSync(full);
    const result = await parseResumeFile({
      buffer,
      fileName: c.file,
    });

    if (!result.ok) {
      console.error(`FAIL ${c.file}:`, result.error);
      failed += 1;
      continue;
    }

    const stats = summarizeParsedFields(result.fields);
    const nameOk = c.expectName.test(result.fields.contact.fullName);
    const emailOk = c.expectEmail.test(result.fields.contact.email);
    const expOk = stats.experienceCount >= 1;
    const bulletsOk = stats.bulletCount >= c.minBullets;

    if (nameOk && emailOk && expOk && bulletsOk) {
      console.log(
        `PASS ${c.file} — name="${result.fields.contact.fullName}", email ok, ${stats.experienceCount} jobs / ${stats.bulletCount} bullets`
      );
    } else {
      console.error(`FAIL ${c.file}`, {
        name: result.fields.contact.fullName,
        email: result.fields.contact.email,
        phone: result.fields.contact.phone,
        stats,
        warnings: result.warnings,
        preview: result.text.slice(0, 400),
      });
      failed += 1;
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} fixture(s) failed`);
    process.exit(1);
  }
  console.log("\nAll golden import fixtures passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
