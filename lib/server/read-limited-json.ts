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
 * Returns raw bytes when the full body fits under the limit.
 */
export async function readLimitedBodyBuffer(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<Uint8Array> {
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
    return new Uint8Array(0);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/**
 * Consume a request body stream, aborting as soon as `maxBytes` is exceeded.
 * Returns the decoded UTF-8 string when the full body fits under the limit.
 */
export async function readLimitedBodyBytes(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<string> {
  const buffer = await readLimitedBodyBuffer(stream, maxBytes);
  if (buffer.byteLength === 0) return "";
  return new TextDecoder("utf-8").decode(buffer);
}

/**
 * Reject oversized Content-Length early, then stream-cap the body so missing
 * or lying Content-Length (and chunked bodies) cannot bypass the limit.
 * Returns raw bytes suitable for multipart / binary payloads.
 */
export async function readLimitedRequestBody(
  request: {
    headers: { get(name: string): string | null };
    body: ReadableStream<Uint8Array> | null;
  },
  maxBytes: number
): Promise<Uint8Array> {
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
    return new Uint8Array(0);
  }

  return readLimitedBodyBuffer(stream, maxBytes);
}
