import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LandingCta } from "@/components/landing/LandingCta";
import { HeroResume } from "@/components/landing/HeroResume";
import { ProShowcase } from "@/components/landing/ProShowcase";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { PRO_PLAN, formatPrice } from "@/lib/pro";
import {
  IconCheck,
  IconDownload,
  IconEye,
  IconInfinity,
  IconLock,
  IconShield,
  IconUpload,
  IconX,
} from "@/components/ui/icons";
import type { TemplateId } from "@/lib/schema";

const COMPARISON: { label: string; them: string; us: string }[] = [
  { label: "Download your PDF", them: "Paywall after you finish", us: "Free, unlimited" },
  { label: "Number of resumes", them: "1 on the free plan", us: "Unlimited versions" },
  { label: "Watermark", them: "Often", us: "Never" },
  { label: "Account required", them: "Before you start", us: "Never — it's optional" },
  { label: "Where your data lives", them: "Their servers", us: "Your browser (sync if you want)" },
  { label: "ATS check", them: "Often a paid add-on", us: "Free, unlimited" },
  { label: "AI writing help", them: "Bundled into a pricey plan", us: `Optional Pro add-on, ${formatPrice(PRO_PLAN.monthlyPrice)}/mo` },
];

const STEPS = [
  {
    icon: IconUpload,
    title: "Import or start fresh",
    body: "Drop in an old PDF or Word resume and we fill in the fields — or pick a template and start typing.",
  },
  {
    icon: IconEye,
    title: "Edit with a live preview",
    body: "Every keystroke shows up on the page. A one-page meter tells you the moment you spill onto page two.",
  },
  {
    icon: IconDownload,
    title: "Download and apply",
    body: "A crisp PDF that matches the preview, plus Word and plain text for picky application portals.",
  },
];

const SHOWCASE: { id: TemplateId; name: string }[] = [
  { id: "classic", name: "Classic ATS" },
  { id: "modern", name: "Modern Clean" },
  { id: "accent", name: "Accent Clean" },
];

const FAQ = [
  {
    q: "Is it actually free?",
    a: "Yes. Building, designing, unlimited resumes, and PDF/Word/text downloads are free with no watermark — forever. Only the AI features in Redox Pro cost money, and nothing in the free builder will ever move behind that paywall.",
  },
  {
    q: "What do I get with Redox Pro?",
    a: `AI that does the slow parts: a match score against any job posting plus a one-click tailored resume, spelling and grammar checks, bullet rewrites that turn duties into results, and a recurring email of jobs that match your skills — each with a ready-to-review tailored resume. It's ${formatPrice(PRO_PLAN.monthlyPrice)}/month or ${formatPrice(PRO_PLAN.yearlyPrice)}/year.`,
  },
  {
    q: "Is Pro available now?",
    a: "Pro is launching soon. Join the waitlist in the pricing section and we'll email you the moment it's live. Joining is free and doesn't commit you to anything.",
  },
  {
    q: "Do I need an account?",
    a: "No. Open the builder and start. Your resumes save automatically in your browser. Create an account only if you want them synced across devices.",
  },
  {
    q: "Will my resume get through applicant tracking systems (ATS)?",
    a: "Every template is single-column with real text, standard section headings, and no tables or images — the format parsers read most reliably. The free ATS check shows exactly what a parser pulls out of your resume and what to fix, and the Job match tab shows which keywords from a posting you're missing.",
  },
  {
    q: "Who can see my resume?",
    a: "Only you. Your content stays in your browser unless you turn on sync. Files you import are read to fill in the form and are not stored. If you use a Pro AI feature, only the text you ask it to work on is sent to our AI provider to generate suggestions.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes — the builder is designed for phones too, with a full-size preview one tap away.",
  },
];

export default function LandingPage() {
  return (
    <div className="h-full overflow-y-auto bg-paper text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4">
          <Logo href="/" />
          <nav className="hidden items-center gap-1 text-sm font-medium text-ink-muted md:flex" aria-label="Main">
            <a href="#how" className="rounded-full px-3 py-2 hover:text-ink">How it works</a>
            <a href="#templates" className="rounded-full px-3 py-2 hover:text-ink">Templates</a>
            <a href="#pro" className="rounded-full px-3 py-2 hover:text-ink">Pro</a>
            <a href="#pricing" className="rounded-full px-3 py-2 hover:text-ink">Pricing</a>
            <a href="#faq" className="rounded-full px-3 py-2 hover:text-ink">FAQ</a>
          </nav>
          <Link href="/app" className="btn btn-primary">
            Open builder
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-brand-200/40 blur-3xl" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
            <div className="relative animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-moss-500" /> Free downloads · No watermark · No sign-up
              </p>
              <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-[64px] lg:text-[72px]">
                The resume builder that{" "}
                <span className="relative whitespace-nowrap italic text-brand-600">
                  doesn&apos;t charge
                  <svg aria-hidden viewBox="0 0 300 12" className="absolute -bottom-1 left-0 w-full text-brand-300" preserveAspectRatio="none">
                    <path d="M2 9c60-6 160-8 296-3" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                you at the finish line.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
                Most &ldquo;free&rdquo; builders let you write your whole resume, then
                ask for a credit card to download it. Resume Redox doesn&apos;t. Polished,
                ATS-friendly templates, live preview, and unlimited PDF downloads.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <LandingCta />
                <Link href="/app?start=import" className="btn btn-secondary btn-lg">
                  <IconUpload size={18} /> Import my old resume
                </Link>
              </div>
              <p className="mt-4 text-sm text-ink-faint">
                Free forever · Works on your phone · Optional AI with{" "}
                <a href="#pro" className="font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                  {PRO_PLAN.name}
                </a>
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
              <div className="relative rotate-[1.5deg] overflow-hidden rounded-xl border border-line bg-white shadow-pop transition duration-500 hover:rotate-0">
                <HeroResume templateId="accent" />
              </div>
              <div className="absolute -left-6 top-[38%] hidden -rotate-3 items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold shadow-lift sm:flex">
                <span className="h-2 w-2 rounded-full bg-moss-500" /> Fits on one page
              </div>
              <div className="absolute -right-3 bottom-24 hidden rotate-2 items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-paper shadow-lift sm:flex">
                <IconDownload size={15} /> PDF · Word · TXT
              </div>
              <div className="absolute -bottom-4 left-10 hidden -rotate-1 items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold shadow-lift sm:flex">
                <IconShield size={16} className="text-moss-600" /> ATS-friendly
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">The catch</p>
              <h2 className="mt-3 font-display text-[36px] font-semibold leading-tight tracking-tight sm:text-[44px]">
                There isn&apos;t one.
              </h2>
              <p className="mt-3 text-lg text-ink-muted">
                Your resume is how you pay rent. You shouldn&apos;t have to pay rent to download it.
              </p>
            </div>
            <div className="mt-10 overflow-hidden rounded-2xl border border-line">
              <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-paper px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted sm:px-6">
                <span />
                <span>Typical builder</span>
                <span className="text-ink">Resume Redox</span>
              </div>
              {COMPARISON.map((row) => (
                <div key={row.label} className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-2 border-t border-line px-4 py-4 text-sm sm:px-6">
                  <span className="font-medium">{row.label}</span>
                  <span className="flex items-start gap-1.5 text-ink-muted">
                    <IconX size={15} className="mt-0.5 shrink-0 text-red-500" /> {row.them}
                  </span>
                  <span className="flex items-start gap-1.5 font-medium">
                    <IconCheck size={15} className="mt-0.5 shrink-0 text-moss-600" /> {row.us}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 max-w-2xl font-display text-[36px] font-semibold leading-tight tracking-tight sm:text-[44px]">
              From blank page to sent application in three steps.
            </h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="card p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper text-ink">
                      <Icon size={22} />
                    </span>
                    <span className="font-display text-4xl font-semibold text-line-strong">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="scroll-mt-20 border-t border-line bg-paper-deep/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-xl">
                <p className="eyebrow">Templates</p>
                <h2 className="mt-3 font-display text-[36px] font-semibold leading-tight tracking-tight sm:text-[44px]">
                  Designed for recruiters. Built for robots.
                </h2>
                <p className="mt-3 text-ink-muted">
                  Clean, single-column layouts that look sharp to humans and parse cleanly in
                  applicant tracking systems. Switch any time without retyping.
                </p>
              </div>
              <LandingCta className="btn btn-brand btn-lg self-start md:self-auto" freshLabel="Try them free" />
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {SHOWCASE.map((t, i) => (
                <figure key={t.id} className={i === 1 ? "sm:-translate-y-6" : ""}>
                  <div className="overflow-hidden rounded-xl bg-white shadow-lift ring-1 ring-line">
                    <HeroResume templateId={t.id} />
                  </div>
                  <figcaption className="mt-3 text-sm font-medium text-ink-soft">{t.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <ProShowcase />

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            <p className="eyebrow">Pricing</p>
            <h2 className="mt-3 max-w-2xl font-display text-[36px] font-semibold leading-tight tracking-tight sm:text-[44px]">
              Free forever. Pro only if you want AI.
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">
              Building and downloading your resume never costs a thing. Pay for {PRO_PLAN.name} only
              when you want AI tailoring, proofreading, rewriting, and job alerts.
            </p>
            <PricingPlans />
            <p className="mt-6 flex items-start gap-2 text-[13px] text-ink-muted">
              <IconLock size={15} className="mt-0.5 shrink-0" /> Our promise: nothing in the free
              builder will ever move behind the paywall.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2 className="mt-3 font-display text-[36px] font-semibold leading-tight tracking-tight sm:text-[44px]">
                Fair questions.
              </h2>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <IconInfinity size={24} />
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-[36px] font-semibold leading-tight tracking-tight sm:text-[48px]">
            Your next job starts with a better page.
          </h2>
          <div className="mt-8 flex justify-center">
            <LandingCta />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:px-8">
          <Logo href="/" />
          <p>Made for job seekers. Free downloads, always.</p>
        </div>
      </footer>
    </div>
  );
}
