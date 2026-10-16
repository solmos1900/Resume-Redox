"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACCENT_SWATCHES,
  DESIGN_FONT_OPTIONS,
  DESIGN_FONT_SIZE_OPTIONS,
  DESIGN_SPACING_OPTIONS,
  getDesignSettings,
  normalizeAccentColor,
} from "@/lib/design";
import type { DesignSettings, ReorderableSectionId, ResumeVersion } from "@/lib/schema";
import { useResumeStore } from "@/lib/store";
import { TEMPLATE_CATALOG } from "@/lib/templates/catalog";
import { moveSection, normalizeSectionOrder, SECTION_LABELS } from "@/lib/templates/section-order";
import { createSeedVersion } from "@/lib/seed-data";
import { ResumeThumbnail } from "@/components/preview/ResumeThumbnail";
import { IconArrowLeft, IconCheck, IconGrip } from "@/components/ui/icons";

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white/70 p-4">
      <h2 className="font-display text-[17px] font-semibold tracking-tight">{title}</h2>
      {hint && <p className="mt-0.5 text-[13px] text-ink-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-paper-deep p-1">
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.id)}
            className={`min-h-[36px] rounded-lg px-2 text-[13px] font-medium transition ${
              selected ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function DesignTab() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);
  const [hexDraft, setHexDraft] = useState("#1e5aa8");

  useEffect(() => {
    if (version) setHexDraft(getDesignSettings(version).accentColor);
  }, [version?.id, version?.design?.accentColor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Thumbnails show the user's own resume once it has real body content;
  // until then, the sample (with their design settings) is more telling.
  const sample = useMemo(() => createSeedVersion(), []);
  const hasBody =
    !!version &&
    (version.summary.trim().length > 0 ||
      version.experience.some((e) => e.title.trim() || e.bullets.some((b) => b.trim())));
  const thumbSource: ResumeVersion | undefined = version
    ? hasBody
      ? version
      : { ...sample, design: version.design, sectionOrder: version.sectionOrder }
    : undefined;

  if (!version || !thumbSource) return null;

  const design = getDesignSettings(version);
  const sectionOrder = normalizeSectionOrder(version.sectionOrder);
  const isAccent = version.templateId === "accent";
  const patchDesign = (patch: Partial<DesignSettings>) =>
    updateActiveVersion({ design: { ...design, ...patch } });

  return (
    <div className="space-y-4">
      <Panel title="Template" hint="Same content, different look. All are ATS-friendly.">
        <div className="grid grid-cols-3 gap-2.5">
          {TEMPLATE_CATALOG.map((t) => {
            const selected = t.id === version.templateId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => updateActiveVersion({ templateId: t.id })}
                aria-pressed={selected}
                className="group text-left focus-visible:outline-none"
              >
                <span
                  className={`relative block overflow-hidden rounded-lg border-2 transition ${
                    selected
                      ? "border-brand-500 shadow-card"
                      : "border-line group-hover:border-line-strong group-focus-visible:border-brand-300"
                  }`}
                >
                  <ResumeThumbnail version={thumbSource} templateId={t.id} />
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white shadow">
                      <IconCheck size={12} />
                    </span>
                  )}
                </span>
                <span className={`mt-1.5 block truncate text-[12px] font-medium ${selected ? "text-ink" : "text-ink-muted"}`}>
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Typography & spacing">
        <div className="space-y-4">
          <div>
            <span className="field-label">Font</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {DESIGN_FONT_OPTIONS.map((opt) => {
                const selected = design.fontFamily === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patchDesign({ fontFamily: opt.id })}
                    aria-pressed={selected}
                    className={`flex min-h-[44px] items-center justify-center rounded-xl border px-2 text-[15px] transition ${
                      selected ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-line-strong"
                    }`}
                    style={{ fontFamily: opt.stack }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="field-label">Text size</span>
            <Segmented label="Text size" value={design.fontSize} options={DESIGN_FONT_SIZE_OPTIONS} onChange={(v) => patchDesign({ fontSize: v })} />
          </div>
          <div>
            <span className="field-label">Spacing</span>
            <Segmented label="Spacing" value={design.spacing} options={DESIGN_SPACING_OPTIONS} onChange={(v) => patchDesign({ spacing: v })} />
            <p className="mt-1.5 text-[12px] text-ink-faint">Spilling onto page 2? Try Compact or Tight first.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Color">
        {isAccent ? (
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_SWATCHES.map((swatch) => {
              const selected = normalizeAccentColor(design.accentColor) === swatch;
              return (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Accent color ${swatch}`}
                  aria-pressed={selected}
                  onClick={() => {
                    setHexDraft(swatch);
                    patchDesign({ accentColor: swatch });
                  }}
                  className={`h-9 w-9 rounded-full ring-offset-2 transition ${selected ? "ring-2 ring-ink" : "hover:scale-110"}`}
                  style={{ backgroundColor: swatch }}
                />
              );
            })}
            <label className="ml-1 flex items-center gap-2">
              <span className="sr-only">Custom color</span>
              <input
                type="color"
                value={normalizeAccentColor(design.accentColor)}
                onChange={(e) => {
                  const next = normalizeAccentColor(e.target.value);
                  setHexDraft(next);
                  patchDesign({ accentColor: next });
                }}
                className="h-9 w-9 cursor-pointer rounded-full border border-line bg-white p-0.5"
              />
              <input
                type="text"
                spellCheck={false}
                aria-label="Custom color hex code"
                value={hexDraft}
                onChange={(e) => setHexDraft(e.target.value)}
                onBlur={() => {
                  const next = normalizeAccentColor(hexDraft);
                  setHexDraft(next);
                  patchDesign({ accentColor: next });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                className="field w-[6.5rem] px-2.5 py-1.5 font-mono text-xs"
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">
              This template is classic black-and-white. Want a pop of color?
            </p>
            <button type="button" onClick={() => updateActiveVersion({ templateId: "accent" })} className="btn btn-secondary btn-sm">
              Switch to Accent Clean
            </button>
          </div>
        )}
      </Panel>

      <Panel title="Section order" hint="Drag, or use the arrows. Contact always stays on top.">
        <SectionOrderList order={sectionOrder} onReorder={(next) => updateActiveVersion({ sectionOrder: next })} />
      </Panel>

      <Panel title="Fine-tune" hint="Small choices that some recruiters care about.">
        <div className="space-y-4">
          <div>
            <span className="field-label">Contact details</span>
            <Segmented
              label="Contact details layout"
              value={version.atsContactLayout ?? "inline"}
              options={[
                { id: "inline", label: "One line" },
                { id: "stacked", label: "Labeled lines" },
              ]}
              onChange={(v) => updateActiveVersion({ atsContactLayout: v })}
            />
          </div>
          <div>
            <span className="field-label">Section headings</span>
            <Segmented
              label="Section heading case"
              value={version.atsHeadingCase ?? "title"}
              options={[
                { id: "title", label: "Title Case" },
                { id: "upper", label: "ALL CAPS" },
              ]}
              onChange={(v) => updateActiveVersion({ atsHeadingCase: v })}
            />
          </div>
          <div>
            <span className="field-label">Call the intro</span>
            <Segmented
              label="Summary heading"
              value={(version.atsSummaryHeading ?? "summary").toLowerCase() as "summary" | "profile"}
              options={[
                { id: "summary", label: "Summary" },
                { id: "profile", label: "Profile" },
              ]}
              onChange={(v) => updateActiveVersion({ atsSummaryHeading: v })}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SectionOrderList({
  order,
  onReorder,
}: {
  order: ReorderableSectionId[];
  onReorder: (next: ReorderableSectionId[]) => void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= order.length) return;
    const next = moveSection(order, from, to);
    onReorder(next);
    if (liveRef.current) {
      liveRef.current.textContent = `${SECTION_LABELS[next[to]]} moved to position ${to + 1} of ${next.length}`;
    }
  };

  return (
    <>
      <ul className="space-y-1.5" aria-label="Reorderable sections">
        {order.map((id, index) => (
          <li
            key={id}
            draggable
            onDragStart={() => setDragging(index)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging !== null) reorder(dragging, index);
              setDragging(null);
            }}
            className={`flex items-center gap-1 rounded-xl border bg-white pl-1 transition ${
              dragging === index ? "border-brand-300 opacity-60" : "border-line"
            }`}
          >
            <span className="flex h-11 w-9 cursor-grab items-center justify-center text-ink-faint active:cursor-grabbing" aria-hidden>
              <IconGrip size={16} />
            </span>
            <span className="flex-1 text-sm font-medium text-ink">{SECTION_LABELS[id]}</span>
            <button
              type="button"
              className="btn-icon h-9 w-9 disabled:opacity-25"
              aria-label={`Move ${SECTION_LABELS[id]} up`}
              disabled={index === 0}
              onClick={() => reorder(index, index - 1)}
            >
              <IconArrowLeft size={15} className="rotate-90" />
            </button>
            <button
              type="button"
              className="btn-icon mr-1 h-9 w-9 disabled:opacity-25"
              aria-label={`Move ${SECTION_LABELS[id]} down`}
              disabled={index === order.length - 1}
              onClick={() => reorder(index, index + 1)}
            >
              <IconArrowLeft size={15} className="-rotate-90" />
            </button>
          </li>
        ))}
      </ul>
      <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic />
    </>
  );
}
