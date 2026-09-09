"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ACCENT_SWATCHES,
  DESIGN_FONT_OPTIONS,
  DESIGN_FONT_SIZE_OPTIONS,
  DESIGN_SPACING_OPTIONS,
  getDesignSettings,
  normalizeAccentColor,
} from "@/lib/design";
import type {
  DesignFontFamily,
  DesignFontSize,
  DesignSettings,
  DesignSpacing,
  ReorderableSectionId,
} from "@/lib/schema";
import { useResumeStore } from "@/lib/store";
import {
  moveSection,
  normalizeSectionOrder,
  SECTION_LABELS,
} from "@/lib/templates/section-order";

function DragHandleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden
      className="text-gray-400"
    >
      <circle cx="5" cy="4" r="1.25" fill="currentColor" />
      <circle cx="11" cy="4" r="1.25" fill="currentColor" />
      <circle cx="5" cy="8" r="1.25" fill="currentColor" />
      <circle cx="11" cy="8" r="1.25" fill="currentColor" />
      <circle cx="5" cy="12" r="1.25" fill="currentColor" />
      <circle cx="11" cy="12" r="1.25" fill="currentColor" />
    </svg>
  );
}

function SectionOrderList({
  order,
  onReorder,
}: {
  order: ReorderableSectionId[];
  onReorder: (next: ReorderableSectionId[], announcement: string) => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const announce = (message: string) => {
    if (liveRef.current) liveRef.current.textContent = message;
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = moveSection(order, from, to);
    const label = SECTION_LABELS[next[to]];
    const message = `${label} moved to position ${to + 1} of ${next.length}`;
    onReorder(next, message);
    announce(message);
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-xs font-medium text-gray-700">Sections</p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Contact stays at the top. Drag or use ↑/↓ to reorder the rest.
        </p>
      </div>

      <div
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 mb-2 flex items-center gap-2"
        aria-disabled
      >
        <span className="w-11 h-11 flex items-center justify-center text-gray-300">
          <DragHandleIcon />
        </span>
        <div>
          <p className="text-sm font-medium text-gray-800">Contact</p>
          <p className="text-[11px] text-gray-500">Pinned at top</p>
        </div>
      </div>

      <ul className="space-y-1.5" role="list" aria-label="Reorderable sections">
        {order.map((id, index) => (
          <li
            key={id}
            draggable
            onDragStart={() => setDraggingIndex(index)}
            onDragEnd={() => setDraggingIndex(null)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingIndex === null) return;
              reorder(draggingIndex, index);
              setDraggingIndex(null);
            }}
            className={`flex items-center gap-1 rounded-lg border bg-white ${
              draggingIndex === index
                ? "border-gray-400 opacity-70"
                : "border-gray-200"
            }`}
          >
            <span
              className="w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing touch-manipulation shrink-0"
              aria-hidden
              title="Drag to reorder"
            >
              <DragHandleIcon />
            </span>
            <span className="flex-1 text-sm font-medium text-gray-800 py-2">
              {SECTION_LABELS[id]}
            </span>
            <div className="flex flex-col pr-1.5 shrink-0">
              <button
                type="button"
                className="min-h-11 min-w-11 px-2 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-30 touch-manipulation text-sm"
                aria-label={`Move ${SECTION_LABELS[id]} up`}
                disabled={index === 0}
                onClick={() => reorder(index, index - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="min-h-11 min-w-11 px-2 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-30 touch-manipulation text-sm"
                aria-label={`Move ${SECTION_LABELS[id]} down`}
                disabled={index === order.length - 1}
                onClick={() => reorder(index, index + 1)}
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic />
    </div>
  );
}

export function DesignPanel() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);
  const hexInputId = useId();
  const [hexDraft, setHexDraft] = useState("#1e5aa8");

  useEffect(() => {
    if (!version) return;
    setHexDraft(getDesignSettings(version).accentColor);
  }, [version?.id, version?.design?.accentColor]);

  if (!version) return null;

  const design = getDesignSettings(version);
  const sectionOrder = normalizeSectionOrder(version.sectionOrder);
  const isAccentTemplate = (version.templateId ?? "classic") === "accent";

  const patchDesign = (patch: Partial<DesignSettings>) => {
    updateActiveVersion({
      design: {
        ...design,
        ...patch,
      },
    });
  };

  return (
    <div className="no-print border-b border-gray-200 bg-white px-3 py-3 sm:px-4 shrink-0 max-h-[46vh] overflow-y-auto overscroll-contain">
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Design</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Changes update the live preview and Download → PDF together.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-gray-700">Font</span>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900"
              value={design.fontFamily}
              onChange={(e) =>
                patchDesign({
                  fontFamily: e.target.value as DesignFontFamily,
                })
              }
            >
              {DESIGN_FONT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-700">Size</span>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900"
              value={design.fontSize}
              onChange={(e) =>
                patchDesign({ fontSize: e.target.value as DesignFontSize })
              }
            >
              {DESIGN_FONT_SIZE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-gray-700">Spacing</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {DESIGN_SPACING_OPTIONS.map((opt) => {
              const selected = design.spacing === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    patchDesign({ spacing: opt.id as DesignSpacing })
                  }
                  className={`rounded-md border px-3 py-2 text-xs font-medium touch-manipulation ${
                    selected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium text-gray-700">Accent</legend>
          {!isAccentTemplate && (
            <p className="text-[11px] text-gray-500 mt-1">
              Accent color applies on the Accent template (titles, headline,
              rules). Classic stays monochrome.
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {ACCENT_SWATCHES.map((swatch) => {
              const selected =
                normalizeAccentColor(design.accentColor) === swatch;
              return (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Accent ${swatch}`}
                  title={swatch}
                  onClick={() => {
                    setHexDraft(swatch);
                    patchDesign({ accentColor: swatch });
                  }}
                  className={`h-9 w-9 rounded-md border-2 touch-manipulation ${
                    selected ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              );
            })}
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <span className="sr-only" id={hexInputId}>
                Custom accent hex
              </span>
              <input
                type="color"
                aria-labelledby={hexInputId}
                value={normalizeAccentColor(design.accentColor)}
                onChange={(e) => {
                  const next = normalizeAccentColor(e.target.value);
                  setHexDraft(next);
                  patchDesign({ accentColor: next });
                }}
                className="h-9 w-9 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
              />
              <input
                type="text"
                inputMode="text"
                spellCheck={false}
                aria-labelledby={hexInputId}
                value={hexDraft}
                onChange={(e) => setHexDraft(e.target.value)}
                onBlur={() => {
                  const next = normalizeAccentColor(hexDraft);
                  setHexDraft(next);
                  patchDesign({ accentColor: next });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const next = normalizeAccentColor(hexDraft);
                    setHexDraft(next);
                    patchDesign({ accentColor: next });
                  }
                }}
                className="w-[6.5rem] rounded-md border border-gray-300 px-2 py-1.5 font-mono text-xs text-gray-800"
                placeholder="#1e5aa8"
              />
            </label>
          </div>
        </fieldset>

        <SectionOrderList
          order={sectionOrder}
          onReorder={(next) => {
            updateActiveVersion({ sectionOrder: next });
          }}
        />
      </div>
    </div>
  );
}
