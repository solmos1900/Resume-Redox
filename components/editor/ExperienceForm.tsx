"use client";

import { useResumeStore } from "@/lib/store";
import type { Experience } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { AddRowButton, BulletEditor, EntryCard, TextField, Toggle, moveItem } from "./fields";

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
  const items = version.experience;
  const save = (next: Experience[]) => updateActiveVersion({ experience: next });
  const patch = (id: string, updates: Partial<Experience>) =>
    save(items.map((e) => (e.id === id ? { ...e, ...updates } : e)));

  return (
    <CollapsibleSection
      title="Experience"
      description="Most recent first. Lead each bullet with a verb and a number."
      sectionId="editor-section-experience"
      complete={items.some((e) => e.company.trim() || e.title.trim())}
    >
      {items.map((exp, index) => (
        <EntryCard
          key={exp.id}
          title={exp.title}
          subtitle={[exp.company, [exp.startDate, exp.current ? "Present" : exp.endDate].filter(Boolean).join(" – ")]
            .filter(Boolean)
            .join(" · ")}
          placeholderTitle="New position"
          index={index}
          count={items.length}
          onMove={(d) => save(moveItem(items, index, d))}
          onRemove={() => save(items.filter((e) => e.id !== exp.id))}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField className="col-span-2" label="Job title" value={exp.title} onChange={(v) => patch(exp.id, { title: v })} placeholder="Senior Product Manager" />
            <TextField label="Company" value={exp.company} onChange={(v) => patch(exp.id, { company: v })} placeholder="Acme Corp" />
            <TextField label="Location" value={exp.location} onChange={(v) => patch(exp.id, { location: v })} placeholder="Remote" />
            <TextField label="Start" value={exp.startDate} onChange={(v) => patch(exp.id, { startDate: v })} placeholder="Jan 2022" />
            <TextField
              label="End"
              value={exp.current ? "Present" : exp.endDate}
              onChange={(v) => patch(exp.id, { endDate: v })}
              placeholder="Mar 2024"
              disabled={exp.current}
            />
          </div>
          <Toggle
            checked={exp.current}
            label="I currently work here"
            onChange={(checked) => patch(exp.id, { current: checked, endDate: checked ? "" : exp.endDate })}
          />
          <BulletEditor
            bullets={exp.bullets}
            onChange={(bullets) => patch(exp.id, { bullets })}
            placeholder="Cut onboarding time 40% by redesigning the setup flow"
          />
        </EntryCard>
      ))}
      <AddRowButton onClick={() => save([...items, emptyExperience()])}>Add position</AddRowButton>
    </CollapsibleSection>
  );
}
