"use client";

import { useResumeStore } from "@/lib/store";
import type { SkillGroup } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { AddRowButton, AutoTextarea, EntryCard, TextField, moveItem } from "./fields";

function emptySkillGroup(): SkillGroup {
  return { id: generateId(), category: "", items: "" };
}

export function SkillGroupsForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;
  const groups = version.skillGroups;
  const save = (next: SkillGroup[]) => updateActiveVersion({ skillGroups: next });
  const patch = (id: string, updates: Partial<SkillGroup>) =>
    save(groups.map((g) => (g.id === id ? { ...g, ...updates } : g)));

  return (
    <CollapsibleSection
      title="Skills"
      description="Group related skills. Mirror the exact words from job postings."
      sectionId="editor-section-skills"
      complete={groups.some((g) => g.items.trim())}
    >
      {groups.map((group, index) => (
        <EntryCard
          key={group.id}
          title={group.category}
          subtitle={group.items}
          placeholderTitle="New skill group"
          index={index}
          count={groups.length}
          onMove={(d) => save(moveItem(groups, index, d))}
          onRemove={() => save(groups.filter((g) => g.id !== group.id))}
        >
          <TextField label="Group name" value={group.category} onChange={(v) => patch(group.id, { category: v })} placeholder="Languages & Tools" />
          <label className="block">
            <span className="field-label">Skills, separated by commas</span>
            <AutoTextarea
              value={group.items}
              onChange={(e) => patch(group.id, { items: e.target.value })}
              minRows={2}
              placeholder="Python, SQL, React, AWS"
            />
          </label>
        </EntryCard>
      ))}
      <AddRowButton onClick={() => save([...groups, emptySkillGroup()])}>Add skill group</AddRowButton>
    </CollapsibleSection>
  );
}
