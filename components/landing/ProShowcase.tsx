import { PRO_FEATURES, PRO_PLAN, formatPrice, type ProFeatureId } from "@/lib/pro";
import { IconCheck, IconSparkle } from "@/components/ui/icons";

/** Small static mock-ups so each Pro feature is understood at a glance. */
function Visual({ id }: { id: ProFeatureId }) {
  if (id === "tailor") {
    return (
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 56 56" className="h-16 w-16 -rotate-90" aria-hidden>
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="6" />
            <circle cx="28" cy="28" r="22" fill="none" stroke="#FB743E" strokeWidth="6" strokeLinecap="round" strokeDasharray="138" strokeDashoffset="25" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">82</span>
        </div>
        <ul className="space-y-1 text-[12px] text-paper/70">
          <li className="flex gap-1.5"><span className="text-moss-500">●</span> Strong: roadmap ownership</li>
          <li className="flex gap-1.5"><span className="text-brand-400">●</span> Add: A/B testing results</li>
          <li className="flex gap-1.5"><span className="text-brand-400">●</span> Add: payments domain</li>
        </ul>
      </div>
    );
  }
  if (id === "spellcheck") {
    return (
      <p className="rounded-xl bg-white/5 p-3 text-[13px] leading-relaxed text-paper/80">
        Led <span className="underline decoration-brand-400 decoration-wavy underline-offset-4">acros</span> 3 teams and{" "}
        <span className="underline decoration-brand-400 decoration-wavy underline-offset-4">manage</span> releases
        <span className="mt-2 flex gap-1.5">
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink">across</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink">managed</span>
        </span>
      </p>
    );
  }
  if (id === "bullets") {
    return (
      <div className="space-y-1.5 text-[12px]">
        <p className="rounded-lg bg-white/5 px-3 py-2 text-paper/50 line-through decoration-paper/30">
          Responsible for onboarding improvements.
        </p>
        <p className="rounded-lg bg-white/10 px-3 py-2 text-paper">
          <IconSparkle size={12} className="mr-1 inline text-brand-300" />
          Cut onboarding time 40% by redesigning the setup flow for 12k users.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5 text-[12px]">
      {[
        ["Product Manager, Payments", "94% match"],
        ["Senior PM, Platform", "88% match"],
      ].map(([role, match]) => (
        <div key={role} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
          <span className="min-w-0 truncate text-paper/85">
            {role} <span className="text-paper/45">· {match}</span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink">
            Build resume →
          </span>
        </div>
      ))}
      <p className="text-paper/45">Matched to your skills · delivered by email</p>
    </div>
  );
}

export function ProShowcase() {
  return (
    <section id="pro" className="scroll-mt-20 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
              <IconSparkle size={13} /> {PRO_PLAN.name}
            </p>
            <h2 className="mt-3 font-display text-[36px] font-semibold leading-tight tracking-tight sm:text-[44px]">
              The builder is free. The AI is your secret weapon.
            </h2>
            <p className="mt-3 text-paper/65">
              Upgrade only if you want AI doing the heavy lifting — tailoring, proofreading,
              rewriting, and finding jobs for you. {formatPrice(PRO_PLAN.monthlyPrice)}/month or{" "}
              {formatPrice(PRO_PLAN.yearlyPrice)}/year.
            </p>
          </div>
          <a href="#pricing" className="btn btn-brand btn-lg self-start md:self-auto">
            See Pro pricing
          </a>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-2">
          {PRO_FEATURES.map((f) => (
            <li key={f.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="font-display text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/65">{f.body}</p>
              <div className="mt-5">
                <Visual id={f.id} />
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 flex items-start gap-2 text-sm text-paper/60">
          <IconCheck size={16} className="mt-0.5 shrink-0 text-moss-500" />
          AI never changes your resume on its own — every suggestion waits for your OK.
        </p>
      </div>
    </section>
  );
}
