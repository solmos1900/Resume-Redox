"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";

type Status = "verifying" | "ready" | "invalid" | "done";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const { verifyResetCode, confirmReset } = useAuth();

  const [status, setStatus] = useState<Status>("verifying");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setStatus("invalid");
      return;
    }
    verifyResetCode(oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setStatus("ready");
      })
      .catch((err) => {
        setError(authErrorMessage(err));
        setStatus("invalid");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, oobCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    confirmReset(oobCode, password)
      .then(() => setStatus("done"))
      .catch((err) => setError(authErrorMessage(err)))
      .finally(() => setBusy(false));
  };

  return (
    <div className="h-screen flex items-center justify-center bg-paper-deep p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-line">
        <div className="px-6 py-5 border-b border-line text-center">
          <h1 className="text-lg font-bold text-ink">Resume Redox</h1>
          <p className="text-sm text-ink-muted mt-1">
            {status === "done" ? "Password updated" : "Reset your password"}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {status === "verifying" && (
            <p className="text-sm text-ink-muted text-center">Checking your link…</p>
          )}

          {status === "invalid" && (
            <>
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error ?? "This reset link is invalid or has expired."}
              </p>
              <a
                href="/app"
                className="block w-full text-sm px-4 py-2 border border-line-strong rounded-lg hover:bg-paper font-medium text-center"
              >
                Back to sign in
              </a>
            </>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-2">
              {email && (
                <p className="text-sm text-ink-muted text-center mb-1">
                  Setting a new password for <strong>{email}</strong>
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <input
                type="password"
                required
                minLength={6}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-line-strong rounded-lg"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Retype new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-line-strong rounded-lg"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full text-sm px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink-soft disabled:opacity-40 font-medium"
              >
                Save new password
              </button>
            </form>
          )}

          {status === "done" && (
            <>
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                Your password has been updated.
              </p>
              <a
                href="/app"
                className="block w-full text-sm px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink-soft font-medium text-center"
              >
                Continue to sign in
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
