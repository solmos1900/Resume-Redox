import { spawn } from "child_process";
import path from "path";

export async function renderResumePdf(previewUrl: string): Promise<Uint8Array> {
  const scriptPath = path.join(process.cwd(), "scripts/generate-pdf.mjs");

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const errors: string[] = [];

    const child = spawn(process.execPath, [scriptPath, previewUrl], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errors.push(chunk.toString()));

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
        return;
      }

      const detail = errors.join("").trim();
      reject(
        new Error(
          detail
            ? `PDF generation failed: ${detail}`
            : `PDF generation failed with exit code ${code}`
        )
      );
    });
  });
}
