"use client";

import { useResumeStore } from "@/lib/store";
import type { Education } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { AddRowButton, EntryCard, TextField, moveItem } from "./fields";

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
  const items = version.education;
  const save = (next: Education[]) => updateActiveVersion({ education: next });
  const patch = (id: string, updates: Partial<Education>) =>
    save(items.map((e) => (e.id === id ? { ...e, ...updates } : e)));

  return (
    <CollapsibleSection
      title="Education"
      description="Degree, school, and graduation year. Add honors or GPA only if they help."
      sectionId="editor-section-education"
      complete={items.some((e) => e.institution.trim() || e.details.trim())}
    >
      {items.map((edu, index) => (
        <EntryCard
          key={edu.id}
          title={edu.details}
          subtitle={[edu.institution, edu.graduationDate].filter(Boolean).join(" · ")}
          placeholderTitle="New degree"
          index={index}
          count={items.length}
          onMove={(d) => save(moveItem(items, index, d))}
          onRemove={() => save(items.filter((e) => e.id !== edu.id))}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField className="col-span-2" label="Degree" value={edu.details} onChange={(v) => patch(edu.id, { details: v })} placeholder="B.S. Computer Science" />
            <TextField className="col-span-2" label="School" value={edu.institution} onChange={(v) => patch(edu.id, { institution: v })} placeholder="State University" />
            <TextField label="Location" value={edu.location} onChange={(v) => patch(edu.id, { location: v })} placeholder="Austin, TX" />
            <TextField label="Graduated" value={edu.graduationDate ?? ""} onChange={(v) => patch(edu.id, { graduationDate: v })} placeholder="May 2023" />
          </div>
        </EntryCard>
      ))}
      <AddRowButton onClick={() => save([...items, emptyEducation()])}>Add education</AddRowButton>
    </CollapsibleSection>
  );
}
