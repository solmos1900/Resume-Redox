"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";
import { useUiStore } from "@/lib/ui-store";
import { Modal } from "@/components/ui/Modal";

type EmailMode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5831-5.0359-3.7104H.9575v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
      <path fill="#FBBC05" d="M3.9641 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9575C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9575 4.0418L3.9641 10.71z" />
      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9575 4.9582L3.9641 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" />
    </svg>
  );
}

/**
 * Optional account dialog. An account only adds cloud sync across devices —
 * every editing and download feature works without one.
 */
export function SignInDialog() {
  const open = useUiStore((s) => s.signInOpen);
  const reason = useUiStore((s) => s.signInReason);
  const close = useUiStore((s) => s.closeSignIn);
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } =
    useAuth();

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Close as soon as an account session lands.
  useEffect(() => {
    if (open && user) close();
  }, [open, user, close]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setNotice(null);
      setBusy(false);
      setPassword("");
    }
  }, [open]);

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

  const switchMode = (mode: EmailMode) => {
    setEmailMode(mode);
    setError(null);
    setNotice(null);
  };

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    void withBusy(() =>
      emailMode === "signin"
        ? signInWithEmail(email, password)
        : signUpWithEmail(email, password, name.trim())
    );
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError("Enter your email first, then tap “Forgot password?”");
      return;
    }
    void withBusy(async () => {
      await sendPasswordReset(email.trim());
      setNotice("If an account exists for that email, a reset link is on its way.");
    });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="sm"
      title={emailMode === "signin" ? "Sync across devices" : "Create your free account"}
      description={
        reason ??
        "Optional. Your resumes already save in this browser — an account backs them up and keeps them in sync on your phone and laptop."
      }
    >
      <div className="space-y-4 pb-2">
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl border border-moss-100 bg-moss-50 px-3 py-2 text-sm text-moss-700">
            {notice}
          </p>
        )}

        <button
          type="button"
          onClick={() => void withBusy(signInWithGoogle)}
          disabled={busy}
          className="btn btn-secondary btn-lg w-full"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs text-ink-faint">
          <div className="h-px flex-1 bg-line" />
          or with email
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-2.5">
          {emailMode === "signup" && (
            <label className="block">
              <span className="sr-only">Your name</span>
              <input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="field"
              />
            </label>
          )}
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              className="field"
            />
          </label>
          <label className="block">
            <span className="sr-only">Password</span>
            <input
              type="password"
              required
              minLength={6}
              placeholder={emailMode === "signup" ? "Password (6+ characters)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={emailMode === "signin" ? "current-password" : "new-password"}
              className="field"
            />
          </label>
          <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
            {busy ? "One moment…" : emailMode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <button
            type="button"
            onClick={() => switchMode(emailMode === "signin" ? "signup" : "signin")}
            className="font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            {emailMode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
          {emailMode === "signin" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={busy}
              className="text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-40"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
