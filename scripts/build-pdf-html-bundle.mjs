import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const esbuildBin = path.join(root, "node_modules/.bin/esbuild");
const entry = path.join(root, "lib/export/build-resume-html-entry.tsx");
const outfile = path.join(root, "lib/export/generated/build-resume-html.cjs");

fs.mkdirSync(path.dirname(outfile), { recursive: true });

if (!fs.existsSync(esbuildBin)) {
  console.error("esbuild not found — run: npm install -D esbuild");
  process.exit(1);
}

execFileSync(
  esbuildBin,
  [
    entry,
    "--bundle",
    "--platform=node",
    "--format=cjs",
    "--jsx=automatic",
    `--outfile=${outfile}`,
  ],
  { cwd: root, stdio: "inherit" }
);

console.log(`Wrote ${path.relative(root, outfile)}`);
