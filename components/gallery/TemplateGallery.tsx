"use client";

import { useMemo, useState } from "react";
import { TEMPLATE_CATALOG } from "@/lib/templates/catalog";
import type { TemplateId } from "@/lib/templates/types";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";
import { createSeedVersion, SEED_VERSION_ID } from "@/lib/seed-data";
import { isResumeNonEmpty } from "@/lib/import/resume-content";
import { ResumeThumbnail } from "@/components/preview/ResumeThumbnail";
import { resumeDisplayName } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { IconArrowLeft, IconCheck, IconUpload } from "@/components/ui/icons";

/**
 * "New resume": choose a look. Thumbnails are live renders of the real
 * templates with sample content. Picking one creates the resume and drops
 * the user straight into the editor.
 */
export function TemplateGallery() {
  const versions = useResumeStore((s) => s.versions);
  const createResume = useResumeStore((s) => s.createResume);
  const openHome = useUiStore((s) => s.openHome);
  const openEditor = useUiStore((s) => s.openEditor);
  const openImport = useUiStore((s) => s.openImportResumeDialog);

  const sample = useMemo(() => createSeedVersion(), []);

  // Same person, new role: offer to carry over contact details.
  const contactSource = useMemo(
    () =>
      [...versions]
        .filter((v) => v.id !== SEED_VERSION_ID && v.contact.fullName.trim())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0],
    [versions]
  );
  const [reuseContact, setReuseContact] = useState(true);

  const choose = (templateId: TemplateId) => {
    const contactFromId = contactSource && reuseContact ? contactSource.id : null;
    createResume({ name: "Untitled resume", templateId, contactFromId });
    openEditor({ tab: "content" });
  };

  const hasRealResume = versions.some((v) => v.id !== SEED_VERSION_ID && isResumeNonEmpty(v));

  return (
    <div className="app-chrome flex h-dvh flex-col overflow-hidden bg-paper">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <button type="button" onClick={openHome} className="btn btn-ghost btn-sm -ml-2">
          <IconArrowLeft size={16} /> My resumes
        </button>
        <div className="flex-1" />
        <Logo href={null} compact />
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
          <div className="animate-fade-up flex flex-col gap-5 pb-8 pt-4 sm:flex-row sm:items-end sm:justify-between sm:pt-8">
            <div className="max-w-xl">
              <p className="eyebrow">New resume</p>
              <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight tracking-tight sm:text-[44px]">
                Pick a starting look
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
                Every template is single-column and built to pass applicant
                tracking systems. Switch anytime — your words stay put.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              {!hasRealResume && (
                <button type="button" onClick={() => openImport(null, "new")} className="btn btn-secondary">
                  <IconUpload size={16} /> Import PDF / Word instead
                </button>
              )}
              {contactSource && (
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      reuseContact ? "border-ink bg-ink text-white" : "border-line-strong bg-white"
                    }`}
                  >
                    {reuseContact && <IconCheck size={14} />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={reuseContact}
                    onChange={(e) => setReuseContact(e.target.checked)}
                  />
                  Reuse my contact info from “{resumeDisplayName(contactSource)}”
                </label>
              )}
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:gap-x-8">
            {TEMPLATE_CATALOG.map((template, index) => (
              <li key={template.id} className="animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
                <button
                  type="button"
                  onClick={() => choose(template.id)}
                  className="group block w-full text-left focus-visible:outline-none"
                >
                  <span className="relative block overflow-hidden rounded-xl border border-line bg-white shadow-card transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lift group-focus-visible:ring-2 group-focus-visible:ring-brand-500">
                    <ResumeThumbnail version={sample} templateId={template.id} />
                    <span className="absolute inset-x-3 bottom-3 hidden translate-y-2 rounded-full bg-ink py-2 text-center text-sm font-semibold text-white opacity-0 shadow-lift transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:block">
                      Use this template
                    </span>
                  </span>
                  <span className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[15px] font-semibold text-ink">{template.name}</span>
                    {template.id === "classic" && (
                      <span className="rounded-full bg-moss-50 px-2 py-0.5 text-[11px] font-semibold text-moss-700">
                        Safest pick
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-ink-muted">{template.tagline}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
