"use client";

import { useMemo } from "react";
import { useResumeStore } from "@/lib/store";
import { analyzeJobMatch } from "@/lib/keywords";
import { generateId } from "@/lib/utils";
import { useToastStore } from "@/lib/toast-store";
import { useUiStore } from "@/lib/ui-store";
import { IconCheck, IconLock, IconPlus, IconSparkle, IconTarget } from "@/components/ui/icons";
import { ProBadge } from "@/components/pro/ProBadge";
import { PRO_PLAN, formatPrice } from "@/lib/pro";
import { AutoTextarea, TextField } from "./fields";

/**
 * Tailor a resume to one posting. The keyword check is free and local
 * (no AI). AI scoring, one-click tailoring, and job alerts are Redox Pro.
 */
export function JobMatchTab() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);
  const showToast = useToastStore((s) => s.showToast);
  const openUpgrade = useUiStore((s) => s.openUpgrade);

  const jobText = version?.jobDescription?.text ?? "";
  const jobUrl = version?.jobDescription?.url ?? "";

  const report = useMemo(
    () => (version && jobText.trim().length > 40 ? analyzeJobMatch(version, jobText) : null),
    [version, jobText]
  );

  if (!version) return null;

  const setJob = (patch: { text?: string; url?: string }) =>
    updateActiveVersion({ jobDescription: { url: jobUrl, text: jobText, ...patch } });

  const addToSkills = (term: string) => {
    const groups = version.skillGroups;
    const target = groups.find((g) => /keyword|core|skill/i.test(g.category)) ?? groups[0];
    if (target) {
      const items = target.items.trim();
      updateActiveVersion({
        skillGroups: groups.map((g) =>
          g.id === target.id ? { ...g, items: items ? `${items}, ${term}` : term } : g
        ),
      });
    } else {
      updateActiveVersion({ skillGroups: [{ id: generateId(), category: "Skills", items: term }] });
    }
    showToast(`Added “${term}” to Skills. Keep it only if it's true for you.`);
  };

  const missing = report?.keywords.filter((k) => !k.matched) ?? [];
  const matched = report?.keywords.filter((k) => k.matched) ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-white/70 p-4">
        <h2 className="font-display text-[17px] font-semibold tracking-tight">Target job</h2>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
          Paste the posting you&apos;re applying to. We&apos;ll show which of its key
          terms your resume already covers. Stays private on your device.
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="field-label">Job description</span>
            <AutoTextarea
              value={jobText}
              onChange={(e) => setJob({ text: e.target.value })}
              minRows={5}
              className="max-h-[360px] overflow-y-auto"
              placeholder="Paste the full job posting here…"
            />
          </label>
          <TextField label="Link to posting (optional)" inputMode="url" value={jobUrl} onChange={(v) => setJob({ url: v })} placeholder="https://…" />
        </div>
      </section>

      {report && report.total > 0 && (
        <section className="animate-fade-up rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-[17px] font-semibold tracking-tight">Keyword check</h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-moss-700">Free</span>
          </div>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            <b className="text-ink">{report.matchedCount} of {report.total}</b> key terms from this posting
            appear on your resume. Work missing ones into bullets or Skills — wherever they&apos;re true.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-deep" aria-hidden>
            <div
              className="h-full rounded-full bg-moss-500 transition-[width] duration-500"
              style={{ width: `${report.score}%` }}
            />
          </div>

          {missing.length > 0 && (
            <div className="mt-4">
              <p className="eyebrow mb-2">Missing · tap to add to Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((k) => (
                  <button
                    key={k.term}
                    type="button"
                    onClick={() => addToSkills(k.term)}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 transition hover:border-brand-400 hover:bg-brand-100"
                    title={`Mentioned ${k.count}× in the posting`}
                  >
                    <IconPlus size={12} /> {k.term}
                  </button>
                ))}
              </div>
            </div>
          )}
          {matched.length > 0 && (
            <div className="mt-4">
              <p className="eyebrow mb-2">Already on your resume</p>
              <div className="flex flex-wrap gap-1.5">
                {matched.map((k) => (
                  <span
                    key={k.term}
                    className="inline-flex items-center gap-1 rounded-full bg-moss-50 px-2.5 py-1 text-xs font-medium text-moss-700"
                  >
                    <IconCheck size={12} /> {k.term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <ProJobTools hasPosting={jobText.trim().length > 40} onUpgrade={openUpgrade} />
    </div>
  );
}

/** Pro upsell for this posting: AI match score, one-click tailoring, alerts. */
function ProJobTools({
  hasPosting,
  onUpgrade,
}: {
  hasPosting: boolean;
  onUpgrade: (feature: "tailor" | "alerts") => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-ink bg-ink p-5 text-paper">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <ProBadge tone="dark" />
          <span className="text-[12px] text-paper/60">AI tools for this job</span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[5px] border-white/15">
            <span className="select-none text-sm font-semibold text-paper/70 blur-[3px]" aria-hidden>
              82
            </span>
            <IconLock size={16} className="absolute text-paper/80" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight">AI match score</h2>
            <p className="text-[13px] leading-relaxed text-paper/65">
              Reads the posting like a recruiter: weighs must-haves over nice-to-haves and tells you
              exactly what to change.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onUpgrade("tailor")} className="btn btn-brand w-full">
            <IconSparkle size={16} /> {hasPosting ? "Score & tailor my resume" : "Score a posting"}
          </button>
          <button
            type="button"
            onClick={() => onUpgrade("alerts")}
            className="btn w-full border border-white/20 text-paper hover:bg-white/10"
          >
            <IconTarget size={16} /> Email me jobs like this
          </button>
        </div>
        <p className="mt-3 text-[12px] text-paper/50">
          {PRO_PLAN.name} is {formatPrice(PRO_PLAN.monthlyPrice)}/month. The keyword check above, and the whole
          builder, stay free.
        </p>
      </div>
    </section>
  );
}
