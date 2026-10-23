"use client";

import { useState } from "react";
import { useUiStore } from "@/lib/ui-store";
import { PRO_FEATURES, PRO_PLAN } from "@/lib/pro";
import { useAuth } from "@/components/auth/AuthProvider";
import { Modal } from "@/components/ui/Modal";
import { IconCheck, IconSparkle } from "@/components/ui/icons";
import { BillingToggle, PriceTag, type Billing } from "./BillingToggle";
import { WaitlistForm } from "./WaitlistForm";

/**
 * Every AI entry point opens this. It leads with the feature the user just
 * tapped, shows the whole Pro plan, and (until billing ships) joins the
 * waitlist. It always restates that the builder itself stays free.
 */
export function UpgradeDialog() {
  const open = useUiStore((s) => s.upgradeOpen);
  const featureId = useUiStore((s) => s.upgradeFeature);
  const close = useUiStore((s) => s.closeUpgrade);
  const { user } = useAuth();
  const [billing, setBilling] = useState<Billing>("yearly");

  const lead = PRO_FEATURES.find((f) => f.id === featureId);
  const others = PRO_FEATURES.filter((f) => f.id !== featureId);

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <IconSparkle className="text-brand-500" /> {lead ? lead.title : PRO_PLAN.name}
        </span>
      }
      description={
        lead
          ? `${lead.body} Part of ${PRO_PLAN.name}.`
          : "AI help for the parts of job hunting that take the longest."
      }
    >
      <div className="space-y-5 pb-2">
        <div className="rounded-2xl border border-line bg-paper/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{PRO_PLAN.name}</p>
              <PriceTag billing={billing} />
            </div>
            <BillingToggle value={billing} onChange={setBilling} />
          </div>
          <ul className="mt-4 space-y-2">
            {(lead ? [lead, ...others] : PRO_FEATURES).map((f) => (
              <li key={f.id} className="flex items-start gap-2.5 text-sm">
                <IconCheck size={16} className="mt-0.5 shrink-0 text-moss-600" />
                <span>
                  <span className="font-medium text-ink">{f.title}</span>
                  <span className="text-ink-muted"> — {f.short}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">
            {PRO_PLAN.launched ? "Upgrade" : "Pro is launching soon — save your spot"}
          </p>
          <WaitlistForm
            billing={billing}
            source={featureId ?? "pricing"}
            uid={user?.uid}
            defaultEmail={user?.email ?? ""}
          />
        </div>

        <p className="border-t border-line pt-4 text-[13px] text-ink-muted">
          Everything else stays free, forever: unlimited resumes, every template, and
          PDF, Word &amp; text downloads with no watermark.
        </p>
      </div>
    </Modal>
  );
}
