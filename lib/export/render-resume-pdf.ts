import { spawn } from "node:child_process";
import path from "node:path";
import type { ResumeVersion } from "@/lib/schema";

/**
 * Render a text PDF via a Node child process that Chromium-setContents the
 * same React templates (esbuild bundle + inlined export CSS).
 *
 * Runs outside Next webpack so HTML/CSS are not rewritten. No HTTP fetch of
 * /export/preview — SSO-safe under Vercel Deployment Protection.
 *
 * Engine: Chromium/Skia — selectable text + embedded fonts (FlowCV-class).
 */
export async function renderResumePdf(
  version: ResumeVersion
): Promise<Uint8Array> {
  const workerPath = path.join(process.cwd(), "scripts/render-pdf-worker.mjs");

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(new Uint8Array(Buffer.concat(stdout)));
        return;
      }
      const detail = Buffer.concat(stderr).toString("utf8").trim();
      reject(
        new Error(
          detail
            ? `PDF generation failed: ${detail}`
            : `PDF generation failed with exit code ${code}`
        )
      );
    });

    child.stdin.write(JSON.stringify(version));
    child.stdin.end();
  });
}
