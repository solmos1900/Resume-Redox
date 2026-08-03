"use client";

import { useResumeStore } from "@/lib/store";
import type { Education } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { RepeatableControls } from "./RepeatableControls";

function emptyEducation(): Education {
  return {
    id: generateId(),
    institution: "",
    location: "",
    details: "",
    graduationDate: "",
  };
}

export function EducationForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;

  const updateEducation = (items: Education[]) => {
    updateActiveVersion({ education: items });
  };

  const updateItem = (id: string, updates: Partial<Education>) => {
    updateEducation(
      version.education.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const items = [...version.education];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateEducation(items);
  };

  return (
    <CollapsibleSection
      title="Education"
      sectionId="editor-section-education"
      action={
        <button
          type="button"
          onClick={() =>
            updateEducation([...version.education, emptyEducation()])
          }
          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add
        </button>
      }
    >
      {version.education.length === 0 && (
        <p className="text-sm text-gray-500">No education entries yet.</p>
      )}
      {version.education.map((edu, index) => (
        <div
          key={edu.id}
          className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-gray-500">
              Entry {index + 1}
            </span>
            <RepeatableControls
              onMoveUp={() => moveItem(index, -1)}
              onMoveDown={() => moveItem(index, 1)}
              onRemove={() =>
                updateEducation(version.education.filter((e) => e.id !== edu.id))
              }
              canMoveUp={index > 0}
              canMoveDown={index < version.education.length - 1}
            />
          </div>
          <label className="block">
            <span className="text-xs text-gray-600">Institution</span>
            <input
              type="text"
              value={edu.institution}
              onChange={(e) =>
                updateItem(edu.id, { institution: e.target.value })
              }
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600">Location</span>
            <input
              type="text"
              value={edu.location}
              onChange={(e) =>
                updateItem(edu.id, { location: e.target.value })
              }
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600">Degree / Details</span>
            <input
              type="text"
              value={edu.details}
              onChange={(e) => updateItem(edu.id, { details: e.target.value })}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600">Graduation Date</span>
            <input
              type="text"
              value={edu.graduationDate}
              onChange={(e) =>
                updateItem(edu.id, { graduationDate: e.target.value })
              }
              placeholder="May 2023"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      ))}
    </CollapsibleSection>
  );
}
