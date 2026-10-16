"use client";

import { useMemo } from "react";
import { useResumeStore } from "@/lib/store";
import { analyzeJobMatch } from "@/lib/keywords";
import { generateId } from "@/lib/utils";
import { useToastStore } from "@/lib/toast-store";
import { IconCheck, IconPlus, IconSparkle } from "@/components/ui/icons";
import { AutoTextarea, TextField } from "./fields";

/**
 * Tailor a resume to one posting. The keyword check is free and local;
 * the AI card previews the planned paid tier without blocking anything.
 */
export function JobMatchTab() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);
  const showToast = useToastStore((s) => s.showToast);

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
          <div className="flex items-center gap-4">
            <ScoreRing score={report.score} />
            <div className="min-w-0">
              <h2 className="font-display text-[17px] font-semibold tracking-tight">
                {report.matchedCount} of {report.total} key terms covered
              </h2>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
                {report.score >= 75
                  ? "Strong overlap. Make sure the top terms appear in your recent bullets, not just Skills."
                  : "Work the missing terms into bullets or Skills — wherever they're genuinely true."}
              </p>
            </div>
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

      <section className="relative overflow-hidden rounded-2xl border border-ink bg-ink p-5 text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/30 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-200">
            <IconSparkle size={13} /> Redox AI · Coming soon
          </span>
          <h2 className="mt-3 font-display text-xl font-semibold tracking-tight">
            Let AI do the tailoring
          </h2>
          <ul className="mt-2 space-y-1.5 text-[13px] text-paper/75">
            <li>• Rewrite bullets to match this posting, in your voice</li>
            <li>• Draft a summary and cover letter for the role</li>
            <li>• Catch typos and weak verbs before you hit send</li>
          </ul>
          <p className="mt-3 text-[12px] text-paper/55">
            An optional upgrade. Building, designing, and downloading resumes
            stays free — forever.
          </p>
        </div>
      </section>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const color = score >= 75 ? "#3B8A55" : score >= 45 ? "#EE5419" : "#B2320D";
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#ECE7DF" strokeWidth="6" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {score}%
      </span>
    </div>
  );
}
