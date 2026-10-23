/**
 * Redox Pro — the paid, AI-powered tier. The builder itself (editing,
 * templates, design, unlimited resumes, PDF/Word/TXT downloads) is free
 * forever; only AI features need a subscription.
 *
 * Billing isn't live yet: every "Upgrade" entry point opens the Pro dialog,
 * which collects a waitlist signup. Change prices here only.
 *
 * The ATS check (lib/ats-check.ts) is deliberately free and unlimited: it is
 * deterministic, costs nothing to run, and is the strongest trust signal for
 * the free builder. To meter it later, gate `runAtsCheck` calls in
 * components/editor/AtsTab.tsx — the AI "fix it" step is what Pro sells.
 */

export const PRO_PLAN = {
  name: "Redox Pro",
  monthlyPrice: 5,
  yearlyPrice: 48,
  currency: "USD",
  /** Billing is not live; CTAs read "Join the waitlist". */
  launched: false,
} as const;

/** Percent saved by paying yearly vs. 12 monthly payments. */
export const PRO_YEARLY_SAVINGS_PCT = Math.round(
  (1 - PRO_PLAN.yearlyPrice / (PRO_PLAN.monthlyPrice * 12)) * 100
);

export type ProFeatureId = "tailor" | "spellcheck" | "bullets" | "alerts" | "atsfix";

export const PRO_FEATURES: {
  id: ProFeatureId;
  title: string;
  short: string;
  body: string;
}[] = [
  {
    id: "tailor",
    title: "AI job match & tailoring",
    short: "Score your resume against a posting and build a tailored version in one click.",
    body: "Paste a job description and get an AI match score with the exact gaps to fix — then generate a tailored copy of your resume for that role, ready to review.",
  },
  {
    id: "spellcheck",
    title: "Spelling & grammar check",
    short: "Catch typos, tense slips, and inconsistent formatting before a recruiter does.",
    body: "One pass over your whole resume: typos, grammar, tense consistency, date formats, and repeated words — with one-tap fixes.",
  },
  {
    id: "bullets",
    title: "Bullet enhancer",
    short: "Turn flat duties into strong, measurable accomplishments.",
    body: "Rewrite any bullet with a stronger action verb and a clear result. You pick from suggestions and nothing changes without your approval.",
  },
  {
    id: "atsfix",
    title: "One-click ATS fixes",
    short: "AI resolves the problems the free ATS check finds.",
    body: "The ATS check is free and shows exactly how a parser reads you. Pro goes further: AI rewrites the flagged parts — missing dates, vague titles, weak keywords — and you approve each change.",
  },
  {
    id: "alerts",
    title: "Job alerts that build your resume",
    short: "Matching jobs in your inbox — each with a one-click tailored resume.",
    body: "A recurring email of open roles that fit your skills. Pick one and we start a tailored resume from that posting automatically.",
  },
];

export function formatPrice(amount: number): string {
  return `$${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
}
