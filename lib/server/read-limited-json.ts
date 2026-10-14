import type { NextRequest } from "next/server";

export class PayloadTooLargeError extends Error {
  readonly status = 413;
  constructor(message: string) {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

/**
 * Read a JSON body with a hard byte cap.
 * Rejects oversized Content-Length before buffering when present,
 * then re-checks the actual body length (chunked / lying clients).
 */
export async function readLimitedJson(
  request: NextRequest,
  maxBytes: number
): Promise<unknown> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader != null) {
    const contentLength = Number(contentLengthHeader);
    if (
      Number.isFinite(contentLength) &&
      contentLength > maxBytes
    ) {
      throw new PayloadTooLargeError(
        `Request body too large (max ${maxBytes} bytes).`
      );
    }
  }

  const raw = await request.text();
  const byteLength = Buffer.byteLength(raw, "utf8");
  if (byteLength > maxBytes) {
    throw new PayloadTooLargeError(
      `Request body too large (max ${maxBytes} bytes).`
    );
  }

  if (!raw.trim()) {
    throw new SyntaxError("Empty JSON body");
  }

  return JSON.parse(raw) as unknown;
}
