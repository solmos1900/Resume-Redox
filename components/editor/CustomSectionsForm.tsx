"use client";

import { useResumeStore } from "@/lib/store";
import type { CustomSection, CustomSectionEntry } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { RepeatableControls } from "./RepeatableControls";

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
  return {
    id: generateId(),
    title,
    entries: [emptyEntry()],
  };
}

export function CustomSectionsForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;

  const sections = version.customSections ?? [];

  const setSections = (next: CustomSection[]) => {
    updateActiveVersion({ customSections: next });
  };

  const updateSection = (id: string, updates: Partial<CustomSection>) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  const addSection = (title = "Projects") => {
    setSections([...sections, emptySection(title)]);
  };

  const updateEntry = (
    sectionId: string,
    entryId: string,
    updates: Partial<CustomSectionEntry>
  ) => {
    setSections(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          entries: section.entries.map((entry) =>
            entry.id === entryId ? { ...entry, ...updates } : entry
          ),
        };
      })
    );
  };

  const moveEntry = (
    sectionId: string,
    index: number,
    direction: -1 | 1
  ) => {
    setSections(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        const entries = [...section.entries];
        const target = index + direction;
        if (target < 0 || target >= entries.length) return section;
        [entries[index], entries[target]] = [entries[target], entries[index]];
        return { ...section, entries };
      })
    );
  };

  const addEntry = (sectionId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, entries: [...section.entries, emptyEntry()] }
          : section
      )
    );
  };

  const removeEntry = (sectionId: string, entryId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              entries: section.entries.filter((entry) => entry.id !== entryId),
            }
          : section
      )
    );
  };

  const updateBullet = (
    sectionId: string,
    entryId: string,
    bulletIndex: number,
    value: string
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    const entry = section?.entries.find((e) => e.id === entryId);
    if (!entry) return;
    const bullets = [...entry.bullets];
    bullets[bulletIndex] = value;
    updateEntry(sectionId, entryId, { bullets });
  };

  const addBullet = (sectionId: string, entryId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    const entry = section?.entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(sectionId, entryId, { bullets: [...entry.bullets, ""] });
  };

  const removeBullet = (
    sectionId: string,
    entryId: string,
    bulletIndex: number
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    const entry = section?.entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(sectionId, entryId, {
      bullets: entry.bullets.filter((_, i) => i !== bulletIndex),
    });
  };

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <CollapsibleSection
          key={section.id}
          title={section.title.trim() || "Custom section"}
          sectionId={`editor-section-custom-${section.id}`}
          action={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => addEntry(section.id)}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Entry
              </button>
              <RepeatableControls
                onMoveUp={() => moveSection(sectionIndex, -1)}
                onMoveDown={() => moveSection(sectionIndex, 1)}
                onRemove={() => removeSection(section.id)}
                canMoveUp={sectionIndex > 0}
                canMoveDown={sectionIndex < sections.length - 1}
              />
            </div>
          }
        >
          <label className="block">
            <span className="text-xs text-gray-600">Section title</span>
            <input
              type="text"
              value={section.title}
              onChange={(e) =>
                updateSection(section.id, { title: e.target.value })
              }
              placeholder="Projects"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm font-medium"
            />
          </label>

          {section.entries.length === 0 && (
            <p className="text-sm text-gray-500">No entries yet.</p>
          )}

          {section.entries.map((entry, entryIndex) => (
            <div
              key={entry.id}
              className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-gray-500">
                  Entry {entryIndex + 1}
                </span>
                <RepeatableControls
                  onMoveUp={() => moveEntry(section.id, entryIndex, -1)}
                  onMoveDown={() => moveEntry(section.id, entryIndex, 1)}
                  onRemove={() => removeEntry(section.id, entry.id)}
                  canMoveUp={entryIndex > 0}
                  canMoveDown={entryIndex < section.entries.length - 1}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block col-span-2">
                  <span className="text-xs text-gray-600">
                    Name (project / org)
                  </span>
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) =>
                      updateEntry(section.id, entry.id, {
                        name: e.target.value,
                      })
                    }
                    placeholder="Resume Redox"
                    className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-600">Location</span>
                  <input
                    type="text"
                    value={entry.location}
                    onChange={(e) =>
                      updateEntry(section.id, entry.id, {
                        location: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block col-span-2">
                  <span className="text-xs text-gray-600">
                    Subtitle (role / stack)
                  </span>
                  <input
                    type="text"
                    value={entry.subtitle}
                    onChange={(e) =>
                      updateEntry(section.id, entry.id, {
                        subtitle: e.target.value,
                      })
                    }
                    placeholder="Solo project · Next.js"
                    className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-600">Start Date</span>
                  <input
                    type="text"
                    value={entry.startDate}
                    onChange={(e) =>
                      updateEntry(section.id, entry.id, {
                        startDate: e.target.value,
                      })
                    }
                    placeholder="Jan 2024"
                    className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-600">End Date</span>
                  <input
                    type="text"
                    value={entry.endDate}
                    onChange={(e) =>
                      updateEntry(section.id, entry.id, {
                        endDate: e.target.value,
                      })
                    }
                    placeholder="Present"
                    disabled={entry.current}
                    className="mt-1 w-full rounded border px-2 py-1.5 text-sm disabled:bg-gray-100"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={entry.current}
                  onChange={(e) =>
                    updateEntry(section.id, entry.id, {
                      current: e.target.checked,
                      endDate: e.target.checked ? "" : entry.endDate,
                    })
                  }
                />
                Ongoing
              </label>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-600">
                    Bullets
                  </span>
                  <button
                    type="button"
                    onClick={() => addBullet(section.id, entry.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Add bullet
                  </button>
                </div>
                {entry.bullets.map((bullet, bi) => (
                  <div key={bi} className="flex gap-2">
                    <textarea
                      value={bullet}
                      onChange={(e) =>
                        updateBullet(section.id, entry.id, bi, e.target.value)
                      }
                      rows={2}
                      placeholder="What you built or achieved..."
                      className="flex-1 rounded border px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(section.id, entry.id, bi)}
                      className="text-red-500 text-xs px-1 self-start"
                      title="Remove bullet"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CollapsibleSection>
      ))}

      <div className="rounded-lg border border-dashed border-gray-300 p-3 bg-white">
        <p className="text-xs text-gray-500 mb-2">
          Add a custom section with the same layout as Experience (name,
          subtitle, dates, bullets).
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addSection("Projects")}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            + Projects
          </button>
          <button
            type="button"
            onClick={() => addSection("Leadership")}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            + Leadership
          </button>
          <button
            type="button"
            onClick={() => addSection("Custom Section")}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            + Custom section
          </button>
        </div>
      </div>
    </div>
  );
}
