import type { NextRequest } from "next/server";

export class PayloadTooLargeError extends Error {
  readonly status = 413;
  constructor(message: string) {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

/**
 * Read a JSON body with a hard byte cap enforced while streaming.
 * Rejects oversized Content-Length before reading when present,
 * then streams `request.body` with a running byte counter so missing
 * or lying Content-Length (and chunked bodies) cannot bypass the cap.
 */
export async function readLimitedJson(
  request: NextRequest,
  maxBytes: number
): Promise<unknown> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader != null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new PayloadTooLargeError(
        `Request body too large (max ${maxBytes} bytes).`
      );
    }
  }

  const stream = request.body;
  if (!stream) {
    throw new SyntaxError("Empty JSON body");
  }

  const raw = await readLimitedBodyBytes(stream, maxBytes);
  if (!raw.trim()) {
    throw new SyntaxError("Empty JSON body");
  }

  return JSON.parse(raw) as unknown;
}

/**
 * Consume a request body stream, aborting as soon as `maxBytes` is exceeded.
 * Returns the decoded UTF-8 string when the full body fits under the limit.
 */
export async function readLimitedBodyBytes(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let cancelledForSize = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        cancelledForSize = true;
        // Fire-and-forget cancel so we abort as soon as the cap is exceeded
        // without waiting for the underlying source to drain.
        void reader.cancel("payload too large").catch(() => {});
        throw new PayloadTooLargeError(
          `Request body too large (max ${maxBytes} bytes).`
        );
      }

      chunks.push(value);
    }
  } catch (error) {
    if (!cancelledForSize) {
      try {
        await reader.cancel();
      } catch {
        // Stream may already be closed or cancelled.
      }
    }
    throw error;
  }

  if (totalBytes === 0) {
    return "";
  }

  const decoder = new TextDecoder("utf-8");
  let text = "";
  for (const chunk of chunks) {
    text += decoder.decode(chunk, { stream: true });
  }
  text += decoder.decode();
  return text;
}
