/** Maps Firebase Auth error codes to plain-language messages for the sign-in/reset UI. */
export function authErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (code.includes("wrong-password") || code.includes("invalid-credential")) {
      return "Incorrect email or password.";
    }
    if (code.includes("email-already-in-use")) {
      return "An account already exists with that email.";
    }
    if (code.includes("user-not-found")) {
      return "No account found with that email.";
    }
    if (code.includes("invalid-email")) {
      return "Enter a valid email address.";
    }
    if (code.includes("missing-email")) {
      return "Enter your email address.";
    }
    if (code.includes("weak-password")) {
      return "Choose a password with at least 6 characters.";
    }
    if (code.includes("too-many-requests")) {
      return "Too many attempts. Wait a bit and try again.";
    }
    if (code.includes("expired-action-code")) {
      return "This reset link has expired. Request a new one from the sign-in screen.";
    }
    if (code.includes("invalid-action-code")) {
      return "This reset link has already been used or is invalid.";
    }
    if (code.includes("popup-closed-by-user")) {
      return "";
    }
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
