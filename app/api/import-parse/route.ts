import { NextRequest } from "next/server";
import { handleImportParsePost } from "@/lib/import/import-parse-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** pdf.js / mammoth parse budget; keep under typical serverless limits. */
export const maxDuration = 30;

/**
 * POST /api/import-parse
 *
 * Requires a valid Firebase ID token (`Authorization: Bearer …`) — a signed-in
 * account or a silent anonymous guest session (same pattern as PDF export).
 * Enforces multipart body/file size caps (streamed before full buffering),
 * PDF page + extracted-text caps, a parse timeout, and per-user/IP rate limits
 * (best-effort in-memory on serverless).
 */
export async function POST(request: NextRequest) {
  return handleImportParsePost(request);
}
