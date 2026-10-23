"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  getJoinedWaitlistEmail,
  isValidEmail,
  joinProWaitlist,
  type WaitlistSignup,
} from "@/lib/pro-waitlist";
import { IconCheck } from "@/components/ui/icons";
import type { Billing } from "./BillingToggle";

/**
 * Email capture for Redox Pro while billing isn't live. Shows a confirmed
 * state if this browser already joined.
 */
export function WaitlistForm({
  billing,
  source,
  uid,
  defaultEmail = "",
  tone = "light",
  autoFocus = false,
}: {
  billing: Billing;
  source: WaitlistSignup["source"];
  uid?: string | null;
  defaultEmail?: string;
  tone?: "light" | "dark";
  autoFocus?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const joined = getJoinedWaitlistEmail();
    if (joined) {
      setEmail(joined);
      setStatus("done");
    }
  }, []);

  useEffect(() => {
    if (defaultEmail && !email) setEmail(defaultEmail);
  }, [defaultEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    setStatus("saving");
    setMessage(null);
    try {
      await joinProWaitlist({ email, billing, source, uid });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const dark = tone === "dark";

  if (status === "done") {
    return (
      <div
        role="status"
        className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
          dark ? "bg-white/10 text-paper" : "bg-moss-50 text-moss-700"
        }`}
      >
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dark ? "bg-moss-500 text-white" : "bg-moss-500 text-white"}`}>
          <IconCheck size={12} />
        </span>
        <span>
          <b>You&apos;re on the list.</b> We&apos;ll email {email} as soon as Pro launches.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            autoFocus={autoFocus}
            placeholder="you@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className={`field ${dark ? "border-white/20 bg-white/10 text-paper placeholder:text-paper/40 focus:bg-white/15" : ""}`}
          />
        </label>
        <button type="submit" disabled={status === "saving"} className="btn btn-brand btn-lg shrink-0">
          {status === "saving" ? "Saving…" : "Join the waitlist"}
        </button>
      </div>
      {message ? (
        <p role="alert" className={`text-[13px] ${dark ? "text-brand-200" : "text-red-700"}`}>
          {message}
        </p>
      ) : (
        <p className={`text-[12px] ${dark ? "text-paper/50" : "text-ink-faint"}`}>
          No charge today — we&apos;ll just email you when Pro launches. Unsubscribe anytime.
        </p>
      )}
    </form>
  );
}
