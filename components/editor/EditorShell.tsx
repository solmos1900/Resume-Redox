"use client";

import { useCallback, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore, type EditorTab } from "@/lib/ui-store";
import { useIsDesktop } from "@/lib/use-media-query";
import { SEED_VERSION_ID } from "@/lib/seed-data";
import { isResumeNonEmpty } from "@/lib/import/resume-content";
import { getTemplateById } from "@/lib/templates/catalog";
import type { PageFitResult } from "@/lib/page-fit";
import { EditorPanel } from "./EditorPanel";
import { DesignTab } from "./DesignTab";
import { JobMatchTab } from "./JobMatchTab";
import { EditorTopBar } from "./EditorTopBar";
import { PageFitBadge, PageFitGuide } from "@/components/preview/PageFitGuide";
import { IconEye, IconLayout, IconPalette, IconPencil, IconTarget } from "@/components/ui/icons";

const TABS: { id: EditorTab; label: string; icon: typeof IconPencil }[] = [
  { id: "content", label: "Content", icon: IconPencil },
  { id: "design", label: "Design", icon: IconPalette },
  { id: "job", label: "Job match", icon: IconTarget },
];

function TabBody() {
  const tab = useUiStore((s) => s.editorTab);
  return (
    <div key={tab} className="animate-fade-in">
      {tab === "content" && <EditorPanel />}
      {tab === "design" && <DesignTab />}
      {tab === "job" && <JobMatchTab />}
    </div>
  );
}

function SampleBanner() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const openGallery = useUiStore((s) => s.openGallery);
  const openImport = useUiStore((s) => s.openImportResumeDialog);
  if (version?.id !== SEED_VERSION_ID) return null;
  return (
    <div className="mb-3 rounded-2xl border border-line bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-ink">You&apos;re exploring the sample resume.</p>
      <p className="mt-0.5 text-[13px] text-ink-muted">
        Edit anything to see how it works. Ready for yours?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => openImport(null, "new")} className="btn btn-primary btn-sm">
          Import my resume
        </button>
        <button type="button" onClick={openGallery} className="btn btn-secondary btn-sm">
          Start from scratch
        </button>
      </div>
    </div>
  );
}

function PreviewPane({ mobile = false }: { mobile?: boolean }) {
  const version = useResumeStore((s) => s.getActiveVersion());
  const setEditorTab = useUiStore((s) => s.setEditorTab);
  const setMobileTab = useUiStore((s) => s.setMobileTab);
  const [fit, setFit] = useState<PageFitResult | null>(null);
  const onResult = useCallback((r: PageFitResult | null) => setFit(r), []);
  const empty = !isResumeNonEmpty(version);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-paper-deep/70">
      <div className="no-print flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {fit && !empty && <PageFitBadge result={fit} />}
        </div>
        {version && (
          <button
            type="button"
            onClick={() => {
              setEditorTab("design");
              if (mobile) setMobileTab("edit");
            }}
            className="btn btn-ghost btn-sm"
          >
            <IconLayout size={15} />
            {getTemplateById(version.templateId).name}
            <span className="text-ink-faint">· Change</span>
          </button>
        )}
      </div>
      <div className="print-only-preview relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-10 scrollbar-thin sm:px-8">
        <PageFitGuide onResult={onResult} />
        {empty && (
          <div className="no-print pointer-events-none absolute inset-x-0 top-24 flex justify-center px-6">
            <div className="max-w-xs rounded-2xl bg-ink/90 px-5 py-4 text-center text-paper shadow-pop backdrop-blur">
              <p className="font-display text-lg font-semibold">Your resume builds itself here</p>
              <p className="mt-1 text-[13px] text-paper/70">
                Start with your name and contact details — the page updates as you type.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EditorShell() {
  const isDesktop = useIsDesktop();
  const editorTab = useUiStore((s) => s.editorTab);
  const setEditorTab = useUiStore((s) => s.setEditorTab);
  const mobileTab = useUiStore((s) => s.mobileTab);
  const setMobileTab = useUiStore((s) => s.setMobileTab);

  if (isDesktop) {
    return (
      <div className="app-chrome flex h-dvh flex-col overflow-hidden bg-paper">
        <EditorTopBar />
        <div className="flex min-h-0 flex-1">
          <aside className="no-print flex w-[min(540px,44%)] min-w-[400px] flex-col border-r border-line bg-paper">
            <nav className="flex shrink-0 gap-1 px-5 pb-1 pt-3" aria-label="Editor sections">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = editorTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEditorTab(id)}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-[38px] items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                      active ? "bg-ink text-white shadow-sm" : "text-ink-muted hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                );
              })}
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-16 pt-3 scrollbar-thin">
              <SampleBanner />
              <TabBody />
            </div>
          </aside>
          <PreviewPane />
        </div>
      </div>
    );
  }

  const NAV: { key: string; label: string; icon: typeof IconPencil; active: boolean; onClick: () => void }[] = [
    ...TABS.map((t) => ({
      key: t.id,
      label: t.id === "job" ? "Job" : t.label,
      icon: t.icon,
      active: mobileTab === "edit" && editorTab === t.id,
      onClick: () => {
        setEditorTab(t.id);
        setMobileTab("edit");
      },
    })),
    {
      key: "preview",
      label: "Preview",
      icon: IconEye,
      active: mobileTab === "preview",
      onClick: () => setMobileTab("preview"),
    },
  ];

  return (
    <div className="app-chrome flex h-dvh flex-col overflow-hidden bg-paper">
      <EditorTopBar />
      <div className="min-h-0 flex-1 overflow-hidden">
        {mobileTab === "preview" ? (
          <PreviewPane mobile />
        ) : (
          <div className="h-full overflow-y-auto overscroll-contain px-3 pb-8 pt-3 sm:px-5">
            <SampleBanner />
            <TabBody />
          </div>
        )}
      </div>
      <nav
        className="no-print grid shrink-0 grid-cols-4 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        aria-label="Editor navigation"
      >
        {NAV.map(({ key, label, icon: Icon, active, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
              active ? "text-ink" : "text-ink-faint"
            }`}
          >
            <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${active ? "bg-brand-100 text-brand-700" : ""}`}>
              <Icon size={19} />
            </span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
