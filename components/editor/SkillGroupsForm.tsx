"use client";

import { useResumeStore } from "@/lib/store";
import type { SkillGroup } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { RepeatableControls } from "./RepeatableControls";

function emptySkillGroup(): SkillGroup {
  return { id: generateId(), category: "", items: "" };
}

export function SkillGroupsForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);
  const issueCount = useResumeStore((s) =>
    s.getOpenRecommendationCount("skills")
  );

  if (!version) return null;

  const updateGroups = (groups: SkillGroup[]) => {
    updateActiveVersion({ skillGroups: groups });
  };

  const updateGroup = (id: string, updates: Partial<SkillGroup>) => {
    updateGroups(
      version.skillGroups.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const moveGroup = (index: number, direction: -1 | 1) => {
    const items = [...version.skillGroups];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateGroups(items);
  };

  return (
    <CollapsibleSection
      title="Skills"
      sectionId="editor-section-skills"
      issueCount={issueCount}
      action={
        <button
          type="button"
          onClick={() =>
            updateGroups([...version.skillGroups, emptySkillGroup()])
          }
          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Group
        </button>
      }
    >
      {version.skillGroups.length === 0 && (
        <p className="text-sm text-gray-500">No skill groups yet.</p>
      )}
      {version.skillGroups.map((group, index) => (
        <div
          key={group.id}
          className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-gray-500">
              Group {index + 1}
            </span>
            <RepeatableControls
              onMoveUp={() => moveGroup(index, -1)}
              onMoveDown={() => moveGroup(index, 1)}
              onRemove={() =>
                updateGroups(version.skillGroups.filter((g) => g.id !== group.id))
              }
              canMoveUp={index > 0}
              canMoveDown={index < version.skillGroups.length - 1}
            />
          </div>
          <label className="block">
            <span className="text-xs text-gray-600">Category</span>
            <input
              type="text"
              value={group.category}
              onChange={(e) => updateGroup(group.id, { category: e.target.value })}
              placeholder="Delivery & Strategy"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600">Skills (comma-separated)</span>
            <textarea
              value={group.items}
              onChange={(e) => updateGroup(group.id, { items: e.target.value })}
              rows={2}
              placeholder="TPM, Roadmapping, Agile/Scrum, ..."
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      ))}
    </CollapsibleSection>
  );
}
