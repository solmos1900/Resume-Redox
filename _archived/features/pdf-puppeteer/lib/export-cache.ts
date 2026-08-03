import fs from "fs/promises";
import os from "os";
import path from "path";
import type { ResumeVersion } from "./schema";
import { resumeVersionSchema } from "./schema";

const CACHE_DIR = path.join(os.tmpdir(), "resume-redox-exports");
const TTL_MS = 120_000;

export type ExportSessionOptions = {
  exportedAt: string;
  includeTimestampOnResume: boolean;
};

export type ExportSession = {
  version: ResumeVersion;
  expires: number;
  options?: ExportSessionOptions;
};

function sessionPath(token: string): string {
  return path.join(CACHE_DIR, `${token}.json`);
}

export async function createExportSession(
  version: ResumeVersion,
  options?: ExportSessionOptions
): Promise<string> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const token = crypto.randomUUID();
  const session: ExportSession = {
    version,
    expires: Date.now() + TTL_MS,
    ...(options ? { options } : {}),
  };
  await fs.writeFile(sessionPath(token), JSON.stringify(session), "utf-8");
  return token;
}

export async function getExportSession(
  token: string
): Promise<ExportSession | null> {
  try {
    const raw = await fs.readFile(sessionPath(token), "utf-8");
    const parsed = JSON.parse(raw) as ExportSession;

    if (parsed.expires < Date.now()) {
      await deleteExportSession(token);
      return null;
    }

    const version = resumeVersionSchema.safeParse(parsed.version);
    if (!version.success) return null;

    return {
      version: version.data,
      expires: parsed.expires,
      options: parsed.options,
    };
  } catch {
    return null;
  }
}

export async function deleteExportSession(token: string): Promise<void> {
  try {
    await fs.unlink(sessionPath(token));
  } catch {
    // Ignore missing files.
  }
}
