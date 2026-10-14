import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import type { ResumeVersion } from "@/lib/schema";

/** Hard wall-clock timeout for the Chromium worker (under route maxDuration). */
export const PDF_RENDER_TIMEOUT_MS = Math.max(
  5_000,
  Number.parseInt(process.env.PDF_EXPORT_TIMEOUT_MS || "45000", 10) || 45_000
);

/**
 * Render a text PDF via a Node child worker that Chromium-setContents the
 * same React templates (esbuild HTML bundle + inlined export CSS).
 *
 * Child process avoids Next/webpack rewriting HTML/CSS and package imports.
 * Worker resolves "puppeteer-core" via createRequire(process.cwd()) — never
 * a scoped "@puppeteer-core". No page.goto of /export/preview (SSO-safe).
 *
 * Engine: Chromium/Skia — selectable text + embedded fonts (FlowCV-class).
 * On timeout or abort, the worker process group is SIGKILL'd so Chromium dies.
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

  const useProcessGroup = process.platform !== "win32";

  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(process.execPath, [workerPath], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      // Own process group on Unix so we can kill Chromium grandchildren.
      detached: useProcessGroup,
      env: {
        ...process.env,
        NODE_PATH: nodePath,
      },
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      killPdfWorker(child, useProcessGroup);
      finish(() =>
        reject(
          new Error(
            `PDF generation timed out after ${PDF_RENDER_TIMEOUT_MS}ms`
          )
        )
      );
    }, PDF_RENDER_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

    child.on("error", (error) => {
      killPdfWorker(child, useProcessGroup);
      finish(() => reject(error));
    });

    child.on("close", (code) => {
      if (settled) return;
      if (code === 0) {
        finish(() => resolve(new Uint8Array(Buffer.concat(stdout))));
        return;
      }
      const detail = Buffer.concat(stderr).toString("utf8").trim();
      finish(() =>
        reject(
          new Error(
            detail
              ? `PDF generation failed: ${detail}`
              : `PDF generation failed with exit code ${code}`
          )
        )
      );
    });

    child.stdin.write(JSON.stringify(version));
    child.stdin.end();
  });
}

function killPdfWorker(child: ChildProcess, useProcessGroup: boolean): void {
  if (!child.pid) return;
  try {
    if (useProcessGroup) {
      process.kill(-child.pid, "SIGKILL");
    } else {
      child.kill("SIGKILL");
    }
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      // already exited
    }
  }
}
