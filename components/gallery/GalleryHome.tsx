"use client";

import { TEMPLATE_CATALOG } from "@/lib/templates/catalog";
import type { TemplateId } from "@/lib/templates/types";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";

/** Target gallery inventory (GF7 fills remaining slots with real templates). */
const GALLERY_SLOT_COUNT = 12;

type GallerySlot =
  | { kind: "template"; id: TemplateId; name: string; tagline: string }
  | { kind: "placeholder"; index: number; label: string };

function buildGallerySlots(): GallerySlot[] {
  const real: GallerySlot[] = TEMPLATE_CATALOG.map((t) => ({
    kind: "template" as const,
    id: t.id,
    name: t.name,
    tagline: t.tagline,
  }));

  const placeholders: GallerySlot[] = [];
  for (let i = real.length; i < GALLERY_SLOT_COUNT; i++) {
    placeholders.push({
      kind: "placeholder",
      index: i + 1,
      label: `ATS layout ${i + 1}`,
    });
  }

  return [...real, ...placeholders];
}

const GALLERY_SLOTS = buildGallerySlots();

function PlaceholderThumb({ label }: { label: string }) {
  return (
    <div
      className="relative aspect-[8.5/11] w-full overflow-hidden rounded-sm bg-[#e8ecef]"
      data-needs-real-thumb="true"
      aria-hidden
    >
      {/* Letter-shaped placeholder — not fake art; GF7 replaces with real renders */}
      <div className="absolute inset-[10%] flex flex-col gap-1.5">
        <div className="h-2 w-[55%] rounded-sm bg-[#c5ced6]" />
        <div className="h-1 w-[40%] rounded-sm bg-[#d2d9e0]" />
        <div className="mt-2 h-1 w-full rounded-sm bg-[#d7dde3]" />
        <div className="h-1 w-[92%] rounded-sm bg-[#d7dde3]" />
        <div className="h-1 w-[88%] rounded-sm bg-[#d7dde3]" />
        <div className="mt-2 h-1 w-full rounded-sm bg-[#d7dde3]" />
        <div className="h-1 w-[90%] rounded-sm bg-[#d7dde3]" />
        <div className="h-1 w-[70%] rounded-sm bg-[#d7dde3]" />
      </div>
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
        needs-real-thumb
      </span>
      <span className="sr-only">{label} thumbnail placeholder</span>
    </div>
  );
}

export function GalleryHome() {
  const createBlankWithContext = useResumeStore((s) => s.createBlankWithContext);
  const openEditor = useUiStore((s) => s.openEditor);
  const hasEnteredEditor = useUiStore((s) => s.hasEnteredEditor);
  const openJdPasteSheet = useUiStore((s) => s.openJdPasteSheet);
  const openImportResumeDialog = useUiStore((s) => s.openImportResumeDialog);
  const openVersionPicker = useUiStore((s) => s.openVersionPicker);

  const goToEditor = () => {
    openEditor();
  };

  const createBlank = () => {
    createBlankWithContext("New Resume");
    openEditor();
  };

  /**
   * GF1: Blank is the required create path. Existing catalog cards also create
   * a version (so the wall is a real create surface); Change design = GF2.
   * Placeholder slots stay non-interactive until GF7 ships real templates.
   */
  const createFromTemplate = (templateId: TemplateId, name: string) => {
    createBlankWithContext(name, undefined, undefined, templateId);
    openEditor();
  };

  return (
    <div className="relative flex h-dvh max-w-full flex-col overflow-x-hidden overflow-y-hidden bg-[#f3f5f7]">
      {/* Soft atmosphere — not a flat slab */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,_#ffffff_0%,_#eef1f4_45%,_#e4e9ee_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 max-w-[50vw] rounded-full bg-[#d9e2ec]/40 blur-3xl"
      />

      <header className="gallery-home-chrome relative z-10 flex w-full max-w-full shrink-0 items-center justify-between gap-3 border-b border-[#d8dee6]/80 bg-white/70 px-4 pb-3.5 backdrop-blur-md sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5a6572]">
            Resume Redox
          </p>
        </div>
        <button
          type="button"
          onClick={goToEditor}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border border-[#c9d2dc] bg-white px-3 text-sm font-medium text-[#1c2430] shadow-sm transition hover:border-[#9aa8b8] hover:bg-[#f8fafc] sm:px-3.5"
        >
          Your resumes
          <span className="text-[#6b7785]" aria-hidden>
            →
          </span>
          <span className="hidden text-xs font-normal text-[#6b7785] sm:inline">
            {hasEnteredEditor ? "last editor" : "editor"}
          </span>
        </button>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col overflow-hidden px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="min-w-0 shrink-0 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-[#121820] sm:text-4xl">
            Choose a design
          </h1>
          <p className="mt-2 text-sm text-[#5a6572] sm:text-base">
            ATS-safe layouts. You can change templates anytime.
          </p>
        </div>

        {/* Sticky entry chips — equal 3-col grid, never 2+1 wrap */}
        <div className="sticky top-0 z-20 -mx-4 mt-5 shrink-0 border-y border-[#d8dee6]/70 bg-[#f3f5f7]/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
          <div className="grid grid-cols-3 gap-2">
            <ChipButton
              onClick={openJdPasteSheet}
              ariaLabel="Paste a job description"
            >
              From a job
            </ChipButton>
            <ChipButton
              onClick={() => openImportResumeDialog()}
              ariaLabel="Import PDF/DOCX"
            >
              From a file
            </ChipButton>
            <ChipButton
              onClick={openVersionPicker}
              ariaLabel="Use an existing version"
            >
              From a resume
            </ChipButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-5 pb-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 lg:gap-4">
            {/* Blank first — always works without JD */}
            <button
              type="button"
              onClick={createBlank}
              className="group flex flex-col rounded-xl border border-dashed border-[#9aa8b8] bg-white/80 p-3 text-left shadow-sm transition hover:border-[#1c2430] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c2430]"
            >
              <div className="flex aspect-[8.5/11] w-full items-center justify-center rounded-sm bg-[#f7f9fb]">
                <span className="text-3xl font-light text-[#8a96a4]" aria-hidden>
                  +
                </span>
              </div>
              <span className="mt-3 text-sm font-semibold text-[#121820]">
                Blank
              </span>
              <span className="mt-0.5 text-xs text-[#6b7785]">
                Default Classic ATS
              </span>
            </button>

            {GALLERY_SLOTS.map((slot) => {
              if (slot.kind === "placeholder") {
                return (
                  <div
                    key={`slot-${slot.index}`}
                    className="flex flex-col rounded-xl border border-[#e0e5eb] bg-white/50 p-3 opacity-70"
                    aria-disabled
                  >
                    <PlaceholderThumb label={slot.label} />
                    <span className="mt-3 text-sm font-medium text-[#5a6572]">
                      {slot.label}
                    </span>
                    <span className="mt-0.5 text-xs text-[#8a96a4]">
                      Coming in GF7
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => createFromTemplate(slot.id, slot.name)}
                  className="group flex flex-col rounded-xl border border-[#d8dee6] bg-white p-3 text-left shadow-sm transition hover:border-[#1c2430] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c2430]"
                >
                  <PlaceholderThumb label={slot.name} />
                  <span className="mt-3 text-sm font-semibold text-[#121820]">
                    {slot.name}
                  </span>
                  <span className="mt-0.5 text-xs text-[#6b7785]">
                    {slot.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-lg border border-[#c9d2dc] bg-white px-1.5 text-center text-xs font-medium leading-tight text-[#1c2430] shadow-sm transition hover:border-[#7d8b9c] hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c2430] sm:px-3 sm:text-sm"
    >
      {children}
    </button>
  );
}
