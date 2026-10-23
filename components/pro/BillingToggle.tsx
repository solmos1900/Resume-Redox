"use client";

import { PRO_PLAN, PRO_YEARLY_SAVINGS_PCT, formatPrice } from "@/lib/pro";

export type Billing = "monthly" | "yearly";

export function BillingToggle({
  value,
  onChange,
  tone = "light",
}: {
  value: Billing;
  onChange: (value: Billing) => void;
  tone?: "light" | "dark";
}) {
  const options: { id: Billing; label: string; extra?: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly", extra: `Save ${PRO_YEARLY_SAVINGS_PCT}%` },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className={`inline-grid grid-cols-2 gap-1 rounded-full p-1 ${tone === "dark" ? "bg-white/10" : "bg-paper-deep"}`}
    >
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id)}
            className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition ${
              selected
                ? tone === "dark"
                  ? "bg-white text-ink"
                  : "bg-white text-ink shadow-sm"
                : tone === "dark"
                  ? "text-paper/70 hover:text-paper"
                  : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.label}
            {o.extra && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selected ? "bg-moss-50 text-moss-700" : "text-moss-600"}`}>
                {o.extra}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** "$5 /month" or "$48 /year · $4/mo". */
export function PriceTag({ billing, tone = "light" }: { billing: Billing; tone?: "light" | "dark" }) {
  const yearly = billing === "yearly";
  const amount = yearly ? PRO_PLAN.yearlyPrice : PRO_PLAN.monthlyPrice;
  const muted = tone === "dark" ? "text-paper/60" : "text-ink-muted";
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className="font-display text-5xl font-semibold tracking-tight">{formatPrice(amount)}</span>
      <span className={`text-base font-medium ${muted}`}>/ {yearly ? "year" : "month"}</span>
      {yearly && (
        <span className={`text-sm ${muted}`}>
          = {formatPrice(PRO_PLAN.yearlyPrice / 12)}/mo
        </span>
      )}
    </p>
  );
}
