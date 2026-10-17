"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import type { CustomSection, CustomSectionEntry } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { CollapsibleSection } from "./CollapsibleSection";
import { AddRowButton, BulletEditor, EntryCard, TextField, Toggle, moveItem } from "./fields";

function emptyEntry(): CustomSectionEntry {
  return {
    id: generateId(),
    name: "",
    location: "",
    subtitle: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [""],
  };
}

function emptySection(title = "Projects"): CustomSection {
  return { id: generateId(), title, entries: [emptyEntry()] };
}

const SUGGESTED_SECTIONS = ["Projects", "Certifications", "Volunteering", "Leadership", "Awards"];

export function CustomSectionsForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;
  const sections = version.customSections ?? [];
  if (sections.length === 0) return null;

  const setSections = (next: CustomSection[]) => updateActiveVersion({ customSections: next });
  const patchSection = (id: string, updates: Partial<CustomSection>) =>
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));

  return (
    <>
      {sections.map((section) => {
        const entries = section.entries;
        const setEntries = (next: CustomSectionEntry[]) => patchSection(section.id, { entries: next });
        const patchEntry = (id: string, updates: Partial<CustomSectionEntry>) =>
          setEntries(entries.map((e) => (e.id === id ? { ...e, ...updates } : e)));

        return (
          <CollapsibleSection
            key={section.id}
            title={section.title.trim() || "Custom section"}
            sectionId={`editor-section-custom-${section.id}`}
            complete={entries.some((e) => e.name.trim())}
            action={<RemoveSectionButton onRemove={() => setSections(sections.filter((s) => s.id !== section.id))} />}
          >
            <TextField
              label="Section heading"
              value={section.title}
              onChange={(v) => patchSection(section.id, { title: v })}
              placeholder="Projects"
            />
            {entries.map((entry, index) => (
              <EntryCard
                key={entry.id}
                title={entry.name}
                subtitle={entry.subtitle}
                placeholderTitle="New entry"
                index={index}
                count={entries.length}
                onMove={(d) => setEntries(moveItem(entries, index, d))}
                onRemove={() => setEntries(entries.filter((e) => e.id !== entry.id))}
              >
                <div className="grid grid-cols-2 gap-3">
                  <TextField className="col-span-2" label="Name" value={entry.name} onChange={(v) => patchEntry(entry.id, { name: v })} placeholder="Open-source CLI tool" />
                  <TextField className="col-span-2" label="Subtitle (role, issuer, or stack)" value={entry.subtitle} onChange={(v) => patchEntry(entry.id, { subtitle: v })} placeholder="Creator · TypeScript" />
                  <TextField className="col-span-2" label="Location (optional)" value={entry.location} onChange={(v) => patchEntry(entry.id, { location: v })} />
                  <TextField label="Start" value={entry.startDate} onChange={(v) => patchEntry(entry.id, { startDate: v })} placeholder="Jan 2024" />
                  <TextField
                    label="End"
                    value={entry.current ? "Present" : entry.endDate}
                    onChange={(v) => patchEntry(entry.id, { endDate: v })}
                    placeholder="2024"
                    disabled={entry.current}
                  />
                </div>
                <Toggle
                  checked={entry.current}
                  label="Ongoing"
                  onChange={(checked) => patchEntry(entry.id, { current: checked, endDate: checked ? "" : entry.endDate })}
                />
                <BulletEditor
                  bullets={entry.bullets}
                  onChange={(bullets) => patchEntry(entry.id, { bullets })}
                  placeholder="What you built, earned, or led"
                />
              </EntryCard>
            ))}
            <AddRowButton onClick={() => setEntries([...entries, emptyEntry()])}>Add entry</AddRowButton>
          </CollapsibleSection>
        );
      })}
    </>
  );
}

function RemoveSectionButton({ onRemove }: { onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <button
      type="button"
      onClick={() => (confirming ? onRemove() : setConfirming(true))}
      onBlur={() => setConfirming(false)}
      className={`btn btn-sm ${confirming ? "bg-red-600 text-white hover:bg-red-700" : "btn-ghost px-2 text-ink-faint hover:text-red-700"}`}
      aria-label={confirming ? "Confirm remove section" : "Remove section"}
      title="Remove section"
    >
      <IconTrash size={15} />
      {confirming && "Remove?"}
    </button>
  );
}

export function AddCustomSectionControls() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);
  if (!version) return null;

  const existing = new Set((version.customSections ?? []).map((s) => s.title.trim().toLowerCase()));
  const addSection = (title: string) => {
    updateActiveVersion({
      customSections: [...(version.customSections ?? []), emptySection(title)],
    });
    requestAnimationFrame(() => {
      const sections = document.querySelectorAll('[id^="editor-section-custom-"]');
      sections[sections.length - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="rounded-2xl border border-dashed border-line-strong p-4">
      <p className="text-sm font-semibold text-ink">Add a section</p>
      <p className="mt-0.5 text-[13px] text-ink-muted">Projects, certifications, and more — same layout as Experience.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_SECTIONS.filter((t) => !existing.has(t.toLowerCase())).map((title) => (
          <button key={title} type="button" onClick={() => addSection(title)} className="btn btn-secondary btn-sm">
            <IconPlus size={14} /> {title}
          </button>
        ))}
        <button type="button" onClick={() => addSection("Custom section")} className="btn btn-ghost btn-sm">
          <IconPlus size={14} /> Custom…
        </button>
      </div>
    </div>
  );
}
