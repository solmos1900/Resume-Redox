"use client";

import { useState } from "react";
import Link from "next/link";
import { PRO_FEATURES, PRO_PLAN } from "@/lib/pro";
import { IconCheck, IconSparkle } from "@/components/ui/icons";
import { BillingToggle, PriceTag, type Billing } from "@/components/pro/BillingToggle";
import { WaitlistForm } from "@/components/pro/WaitlistForm";

const FREE_FEATURES = [
  "Unlimited resumes and tailored versions",
  "Every template, font, color, and layout",
  "Unlimited PDF, Word, and text downloads",
  "No watermark, no sign-up",
  "Import from PDF or Word",
  "ATS check — see how parsers read your resume",
  "Keyword check against a job posting",
  "Optional sync across devices",
];

export function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("yearly");

  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-2">
      <div className="card flex flex-col p-7">
        <p className="text-sm font-semibold text-ink-muted">Free</p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-5xl font-semibold tracking-tight">$0</span>
          <span className="text-base font-medium text-ink-muted">/ forever</span>
        </p>
        <p className="mt-2 text-sm text-ink-muted">Everything you need to build and download a great resume.</p>
        <ul className="mt-6 flex-1 space-y-3 text-sm">
          {FREE_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <IconCheck size={17} className="mt-0.5 shrink-0 text-moss-600" /> {f}
            </li>
          ))}
        </ul>
        <Link href="/app" className="btn btn-primary btn-lg mt-8 w-full">
          Start building — free
        </Link>
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-ink bg-ink p-7 text-paper shadow-pop">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/35 blur-3xl" />
        <div className="relative flex flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-200">
              <IconSparkle size={16} /> {PRO_PLAN.name}
              {!PRO_PLAN.launched && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-paper">
                  Launching soon
                </span>
              )}
            </p>
            <BillingToggle value={billing} onChange={setBilling} tone="dark" />
          </div>
          <div className="mt-3">
            <PriceTag billing={billing} tone="dark" />
          </div>
          <p className="mt-2 text-sm text-paper/60">Everything in Free, plus AI that does the heavy lifting.</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f.id} className="flex items-start gap-2.5">
                <IconSparkle size={16} className="mt-0.5 shrink-0 text-brand-300" />
                <span>
                  <span className="font-medium">{f.title}</span>
                  <span className="text-paper/60"> — {f.short}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <WaitlistForm billing={billing} source="landing" tone="dark" />
          </div>
          <p className="mt-3 text-[12px] text-paper/45">Recurring subscription, billed {billing}. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
