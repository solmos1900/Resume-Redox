import type { ProFeatureId } from "./pro";

const JOINED_KEY = "resume-redox-pro-waitlist";

export type WaitlistSignup = {
  email: string;
  billing: "monthly" | "yearly";
  /** Which feature prompted the signup (for prioritizing what ships first). */
  source: ProFeatureId | "landing" | "pricing";
  uid?: string | null;
};

export class WaitlistUnavailableError extends Error {
  constructor() {
    super("We couldn't save your spot right now. Please try again in a minute.");
    this.name = "WaitlistUnavailableError";
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/**
 * Adds a signup to the `proWaitlist` Firestore collection (create-only rule;
 * see docs/MONETIZATION.md). Throws WaitlistUnavailableError if Firebase isn't
 * configured or the write is rejected.
 */
export async function joinProWaitlist(signup: WaitlistSignup): Promise<void> {
  // Loaded on submit so the landing page doesn't ship Firebase up front.
  const [{ db }, { addDoc, collection, serverTimestamp }] = await Promise.all([
    import("./firebase"),
    import("firebase/firestore"),
  ]);
  if (!db) throw new WaitlistUnavailableError();
  try {
    await addDoc(collection(db, "proWaitlist"), {
      email: signup.email.trim().toLowerCase(),
      billing: signup.billing,
      source: signup.source,
      uid: signup.uid ?? null,
      createdAt: serverTimestamp(),
    });
  } catch {
    throw new WaitlistUnavailableError();
  }
  try {
    localStorage.setItem(JOINED_KEY, signup.email.trim().toLowerCase());
  } catch {
    // storage blocked — signup still recorded server-side
  }
}

/** Email this browser already joined with, if any. */
export function getJoinedWaitlistEmail(): string | null {
  try {
    return localStorage.getItem(JOINED_KEY);
  } catch {
    return null;
  }
}
