"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";

type EmailMode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5831-5.0359-3.7104H.9575v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.9641 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9575C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9575 4.0418L3.9641 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9575 4.9582L3.9641 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
      />
    </svg>
  );
}

export function SignInScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } =
    useAuth();

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      const message = authErrorMessage(err);
      if (message) setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => withBusy(signInWithGoogle);

  const switchMode = (mode: EmailMode) => {
    setEmailMode(mode);
    setError(null);
    setNotice(null);
    setConfirmPassword("");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailMode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    void withBusy(() =>
      emailMode === "signin"
        ? signInWithEmail(email, password)
        : signUpWithEmail(email, password, `${firstName} ${lastName}`.trim())
    );
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError("Enter your email above first, then click “Forgot password?”");
      return;
    }
    void withBusy(async () => {
      await sendPasswordReset(email.trim());
      setNotice(
        "If an account exists for that email, a password reset link is on its way."
      );
    });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 text-center">
          <h1 className="text-lg font-bold text-gray-900">Resume Redox</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to view and edit your resumes.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {notice}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 font-medium"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" />
            or
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-2">
            {emailMode === "signup" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
            />
            {emailMode === "signup" && (
              <input
                type="password"
                required
                minLength={6}
                placeholder="Retype password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
              />
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 font-medium"
            >
              {emailMode === "signin" ? "Sign in" : "Create account"}
            </button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchMode(emailMode === "signin" ? "signup" : "signin")}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {emailMode === "signin"
                  ? "Need an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
              {emailMode === "signin" && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={busy}
                  className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  Forgot password?
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
