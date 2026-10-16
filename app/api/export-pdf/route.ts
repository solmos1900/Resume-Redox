import { NextRequest } from "next/server";
import { handleExportPdfPost } from "@/lib/export/export-pdf-api";

// Static imports so Vercel/NFT traces these into /var/task/node_modules.
import "puppeteer-core";
import "@sparticuz/chromium-min";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Chromium cold start + render; Pro supports up to 60s. Hobby may time out on cold pack download. */
export const maxDuration = 60;

/**
 * POST /api/export-pdf
 *
 * Requires a valid Firebase ID token (`Authorization: Bearer …`).
 * Enforces body-size caps, field-size validation, per-user/IP rate limits
 * (best-effort in-memory on serverless), concurrency cap, and a hard
 * Chromium worker timeout.
 */
export async function POST(request: NextRequest) {
  return handleExportPdfPost(request);
}
