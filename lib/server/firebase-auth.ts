import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * Verify Firebase ID tokens with Google's JWKS.
 * Needs only the Firebase project ID (no service-account JSON).
 * Fail-closed: missing project ID → not configured.
 */

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export type VerifiedFirebaseUser = {
  uid: string;
  email?: string;
  payload: JWTPayload;
};

export function getFirebaseProjectId(): string | null {
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    "";
  return projectId || null;
}

export function isFirebaseServerAuthConfigured(): boolean {
  return Boolean(getFirebaseProjectId());
}

/**
 * Extract and verify `Authorization: Bearer <Firebase ID token>`.
 * Returns null when the header is missing/malformed or the token is invalid.
 * Throws `FirebaseAuthConfigError` when server auth cannot be configured
 * (callers should deny the request — never allow).
 */
export class FirebaseAuthConfigError extends Error {
  constructor(message = "Firebase server auth is not configured") {
    super(message);
    this.name = "FirebaseAuthConfigError";
  }
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedFirebaseUser | null> {
  const projectId = getFirebaseProjectId();
  if (!projectId) {
    throw new FirebaseAuthConfigError();
  }

  const token = idToken.trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const uid = typeof payload.sub === "string" ? payload.sub : "";
    if (!uid) return null;

    const email =
      typeof payload.email === "string" ? payload.email : undefined;

    return { uid, email, payload };
  } catch {
    return null;
  }
}

export function extractBearerToken(
  authorizationHeader: string | null
): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader.trim());
  return match?.[1] ?? null;
}

export async function requireFirebaseUserFromRequest(request: {
  headers: { get(name: string): string | null };
}): Promise<
  | { ok: true; user: VerifiedFirebaseUser }
  | { ok: false; status: 401 | 503; error: string }
> {
  if (!isFirebaseServerAuthConfigured()) {
    return {
      ok: false,
      status: 503,
      error:
        "Server auth is not configured. Set FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    };
  }

  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required. Sign in and retry.",
    };
  }

  const user = await verifyFirebaseIdToken(token);
  if (!user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or expired authentication token.",
    };
  }

  return { ok: true, user };
}
