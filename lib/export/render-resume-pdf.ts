import { spawn } from "node:child_process";
import path from "node:path";
import type { ResumeVersion } from "@/lib/schema";

/**
 * Render a text PDF via a Node child worker that Chromium-setContents the
 * same React templates (esbuild HTML bundle + inlined export CSS).
 *
 * Child process avoids Next/webpack rewriting HTML/CSS and package imports.
 * Worker resolves "puppeteer-core" via createRequire(process.cwd()) — never
 * a scoped "@puppeteer-core". No page.goto of /export/preview (SSO-safe).
 *
 * Engine: Chromium/Skia — selectable text + embedded fonts (FlowCV-class).
 */
export async function renderResumePdf(
  version: ResumeVersion
): Promise<Uint8Array> {
  const workerPath = path.join(process.cwd(), "scripts/render-pdf-worker.mjs");
  const nodePath = [
    path.join(process.cwd(), "node_modules"),
    process.env.NODE_PATH,
  ]
    .filter(Boolean)
    .join(path.delimiter);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_PATH: nodePath,
      },
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
