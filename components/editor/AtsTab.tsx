"use client";

import { useMemo } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";
import { runAtsCheck, type AtsField, type AtsIssue, type AtsTarget } from "@/lib/ats-check";
import { isResumeNonEmpty } from "@/lib/import/resume-content";
import { IconArrowRight, IconCheck, IconSparkle, IconX } from "@/components/ui/icons";
import { ProBadge } from "@/components/pro/ProBadge";

const SECTION_ANCHOR: Record<Exclude<AtsTarget, "design" | "custom">, string> = {
  contact: "editor-section-contact",
  summary: "editor-section-summary",
  experience: "editor-section-experience",
  skills: "editor-section-skills",
  education: "editor-section-education",
};

const SEVERITY = {
  error: { dot: "bg-red-500", label: "Fix", text: "text-red-700" },
  warning: { dot: "bg-amber-500", label: "Improve", text: "text-amber-800" },
  tip: { dot: "bg-ink-faint", label: "Tip", text: "text-ink-muted" },
} as const;

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white/70 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[17px] font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moss-500 text-white">
      <IconCheck size={12} />
    </span>
  ) : (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
      <IconX size={12} />
    </span>
  );
}

function FieldRow({ f }: { f: AtsField }) {
  const optional = f.label === "LinkedIn";
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-20 shrink-0 pt-0.5 text-[12px] font-medium text-ink-muted">{f.label}</span>
      <span className="min-w-0 flex-1 break-words text-sm">
        {f.value ? (
          <span className="text-ink">{f.value}</span>
        ) : (
          <span className="italic text-ink-faint">{optional ? "Not provided (optional)" : "Not found"}</span>
        )}
        {f.status === "different" && f.expected && (
          <span className="block text-[12px] text-amber-800">Your resume says “{f.expected}”</span>
        )}
      </span>
      {(f.value || !optional) && <StatusIcon ok={f.status === "ok"} />}
    </div>
  );
}

/**
 * Free ATS check: shows the fields a resume parser extracts from the
 * download's text layer, then a prioritized fix list. AI fixes are Pro.
 */
export function AtsTab() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const setEditorTab = useUiStore((s) => s.setEditorTab);
  const setMobileTab = useUiStore((s) => s.setMobileTab);
  const openUpgrade = useUiStore((s) => s.openUpgrade);

  const report = useMemo(() => (version ? runAtsCheck(version) : null), [version]);

  if (!version || !report) return null;

  if (!isResumeNonEmpty(version)) {
    return (
      <Panel title="ATS check">
        <p className="text-sm text-ink-muted">
          Add your details in Content first — then come back to see exactly how an applicant tracking
          system reads your resume.
        </p>
      </Panel>
    );
  }

  const goTo = (issue: AtsIssue) => {
    const target = issue.target;
    setMobileTab("edit");
    if (target === "design") {
      setEditorTab("design");
      return;
    }
    setEditorTab("content");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el =
          target === "custom"
            ? document.querySelector('[id^="editor-section-custom-"]')
            : document.getElementById(SECTION_ANCHOR[target]);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      })
    );
  };

  const { issues, checksPassed, checksRun } = report;
  const errors = issues.filter((i) => i.severity === "error").length;
  const allClear = issues.length === 0;
  const pct = Math.round((checksPassed / Math.max(1, checksRun)) * 100);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[19px] font-semibold tracking-tight">How an ATS reads your resume</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              We run the text inside your PDF/Word download through a resume parser — the same step
              applicant tracking systems take before a recruiter ever sees you.
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-moss-700">Free</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-deep" aria-hidden>
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${errors ? "bg-red-500" : allClear ? "bg-moss-500" : "bg-amber-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-semibold">
            {checksPassed} of {checksRun} checks passed
          </span>
        </div>
        {allClear && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-moss-50 px-3 py-2 text-sm text-moss-700">
            <IconCheck size={16} /> Clean parse — every field landed where it should.
          </p>
        )}
      </section>

      {!allClear && (
        <Panel title="What to fix" aside={<span className="text-[12px] text-ink-faint">Most important first</span>}>
          <ul className="divide-y divide-line">
            {issues.map((issue) => {
              const sev = SEVERITY[issue.severity];
              return (
                <li key={issue.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${sev.dot}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      <span className={`mr-1.5 text-[11px] font-bold uppercase tracking-wide ${sev.text}`}>{sev.label}</span>
                      {issue.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{issue.detail}</p>
                  </div>
                  <button type="button" onClick={() => goTo(issue)} className="btn btn-ghost btn-sm shrink-0 px-2.5">
                    Go <IconArrowRight size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => openUpgrade("atsfix")}
            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3.5 py-3 text-left transition hover:border-brand-400"
          >
            <IconSparkle size={18} className="shrink-0 text-brand-600" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                Fix these with AI <ProBadge />
              </span>
              <span className="block text-[12px] text-ink-muted">Review each suggested change before it&apos;s applied.</span>
            </span>
            <IconArrowRight size={16} className="shrink-0 text-brand-600" />
          </button>
        </Panel>
      )}

      <Panel title="Contact details it found">
        <div className="divide-y divide-line">
          {report.contact.map((f) => (
            <FieldRow key={f.label} f={f} />
          ))}
        </div>
      </Panel>

      <Panel title="Work history it found" aside={<span className="text-[12px] text-ink-faint">{report.jobs.length} jobs</span>}>
        {report.jobs.length === 0 ? (
          <p className="text-sm italic text-ink-faint">No jobs were detected.</p>
        ) : (
          <ul className="space-y-2">
            {report.parsed.experience.map((j, i) => {
              const job = report.jobs[i];
              return (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-ink">{j.title || <span className="italic text-ink-faint">No title</span>}</p>
                    <p className="text-[13px] text-ink-soft">
                      {j.company || <span className="italic text-ink-faint">No company</span>}
                      {j.location && <span className="text-ink-muted"> · {j.location}</span>}
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      {job.dates || <span className="italic text-ink-faint">No dates</span>} · {job.bullets} bullet
                      {job.bullets === 1 ? "" : "s"}
                    </p>
                  </div>
                  <StatusIcon ok={job.status === "ok"} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Education">
          {report.education.length === 0 ? (
            <p className="text-sm italic text-ink-faint">None detected</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {report.education.map((e, i) => (
                <li key={i}>
                  <span className="font-medium text-ink">{e.degree || e.school}</span>
                  {e.degree && e.school && <span className="block text-[13px] text-ink-muted">{e.school}</span>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Skills" aside={<span className="text-[12px] text-ink-faint">{report.skills.length}</span>}>
          {report.skills.length === 0 ? (
            <p className="text-sm italic text-ink-faint">None detected</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {report.skills.slice(0, 24).map((s) => (
                <span key={s} className="rounded-full bg-paper-deep px-2 py-0.5 text-[12px] text-ink-soft">
                  {s}
                </span>
              ))}
              {report.skills.length > 24 && <span className="text-[12px] text-ink-faint">+{report.skills.length - 24} more</span>}
            </div>
          )}
        </Panel>
      </div>

      <details className="group rounded-2xl border border-line bg-white/70 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
          See the raw text an ATS receives
          <span className="text-ink-faint transition group-open:rotate-45">+</span>
        </summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-paper p-3 font-mono text-[11.5px] leading-relaxed text-ink-soft scrollbar-thin">
          {report.text}
        </pre>
      </details>

      <p className="px-1 text-[12px] leading-relaxed text-ink-faint">
        A simulation of common parsing rules — real systems (Workday, Greenhouse, Lever…) vary. All
        Resume Redox templates are single-column with real text, the format parsers handle best.
      </p>
    </div>
  );
}
