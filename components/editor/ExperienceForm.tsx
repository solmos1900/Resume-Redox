"use client";

import { useResumeStore } from "@/lib/store";
import type { Experience } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { RepeatableControls } from "./RepeatableControls";

function emptyExperience(): Experience {
  return {
    id: generateId(),
    company: "",
    location: "",
    title: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [""],
  };
}

export function ExperienceForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;

  const updateExperience = (items: Experience[]) => {
    updateActiveVersion({ experience: items });
  };

  const updateItem = (id: string, updates: Partial<Experience>) => {
    updateExperience(
      version.experience.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const items = [...version.experience];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateExperience(items);
  };

  const addItem = () => {
    updateExperience([...version.experience, emptyExperience()]);
  };

  const removeItem = (id: string) => {
    updateExperience(version.experience.filter((e) => e.id !== id));
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    const exp = version.experience.find((e) => e.id === expId);
    if (!exp) return;
    const bullets = [...exp.bullets];
    bullets[bulletIndex] = value;
    updateItem(expId, { bullets });
  };

  const addBullet = (expId: string) => {
    const exp = version.experience.find((e) => e.id === expId);
    if (!exp) return;
    updateItem(expId, { bullets: [...exp.bullets, ""] });
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    const exp = version.experience.find((e) => e.id === expId);
    if (!exp) return;
    updateItem(expId, {
      bullets: exp.bullets.filter((_, i) => i !== bulletIndex),
    });
  };

  return (
    <CollapsibleSection
      title="Experience"
      sectionId="editor-section-experience"
      action={
        <button
          type="button"
          onClick={addItem}
          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add
        </button>
      }
    >
      {version.experience.length === 0 && (
        <p className="text-sm text-gray-500">No experience entries yet.</p>
      )}
      {version.experience.map((exp, index) => (
        <div
          key={exp.id}
          className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-gray-500">
              Job {index + 1}
            </span>
            <RepeatableControls
              onMoveUp={() => moveItem(index, -1)}
              onMoveDown={() => moveItem(index, 1)}
              onRemove={() => removeItem(exp.id)}
              canMoveUp={index > 0}
              canMoveDown={index < version.experience.length - 1}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block col-span-2">
              <span className="text-xs text-gray-600">Company</span>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateItem(exp.id, { company: e.target.value })}
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600">Location</span>
              <input
                type="text"
                value={exp.location}
                onChange={(e) => updateItem(exp.id, { location: e.target.value })}
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block col-span-2">
              <span className="text-xs text-gray-600">Title</span>
              <input
                type="text"
                value={exp.title}
                onChange={(e) => updateItem(exp.id, { title: e.target.value })}
                placeholder="Software Engineer I → Technical Project Manager"
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600">Start Date</span>
              <input
                type="text"
                value={exp.startDate}
                onChange={(e) => updateItem(exp.id, { startDate: e.target.value })}
                placeholder="Sept 2023"
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600">End Date</span>
              <input
                type="text"
                value={exp.endDate}
                onChange={(e) => updateItem(exp.id, { endDate: e.target.value })}
                placeholder="Aug 2022"
                disabled={exp.current}
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm disabled:bg-gray-100"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={exp.current}
              onChange={(e) =>
                updateItem(exp.id, {
                  current: e.target.checked,
                  endDate: e.target.checked ? "" : exp.endDate,
                })
              }
            />
            Current role
          </label>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Bullets</span>
              <button
                type="button"
                onClick={() => addBullet(exp.id)}
                className="text-xs text-blue-600 hover:underline"
              >
                + Add bullet
              </button>
            </div>
            {exp.bullets.map((bullet, bi) => (
              <div key={bi} className="flex gap-2">
                <textarea
                  value={bullet}
                  onChange={(e) => updateBullet(exp.id, bi, e.target.value)}
                  rows={2}
                  placeholder="Achievement with metrics..."
                  className="flex-1 rounded border px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeBullet(exp.id, bi)}
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
  );
}
