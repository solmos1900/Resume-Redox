"use client";

import { useResumeStore } from "@/lib/store";
import type { Contact } from "@/lib/schema";
import { CollapsibleSection } from "./CollapsibleSection";
import { TextField } from "./fields";

export function ContactForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;
  const c = version.contact;

  const set = (field: keyof Contact) => (value: string) => {
    updateActiveVersion({ contact: { ...c, [field]: value } });
  };

  return (
    <CollapsibleSection
      title="Contact"
      description="How recruiters reach you. Name, email, and phone are the must-haves."
      sectionId="editor-section-contact"
      complete={Boolean(c.fullName.trim() && (c.email.trim() || c.phone.trim()))}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField className="sm:col-span-2" label="Full name" value={c.fullName} onChange={set("fullName")} placeholder="Alex Rivera" autoComplete="name" />
        <TextField
          className="sm:col-span-2"
          label="Headline (optional)"
          value={c.headline ?? ""}
          onChange={set("headline")}
          placeholder="Senior Software Engineer · Platform"
          hint="The role you're targeting, shown under your name."
        />
        <TextField label="Email" type="email" inputMode="email" value={c.email} onChange={set("email")} placeholder="you@email.com" autoComplete="email" />
        <TextField label="Phone" type="tel" inputMode="tel" value={c.phone} onChange={set("phone")} placeholder="(555) 234-0100" autoComplete="tel" />
        <TextField className="sm:col-span-2" label="Location" value={c.location} onChange={set("location")} placeholder="Austin, TX" hint="City and state is plenty." />
        <TextField label="LinkedIn" inputMode="url" value={c.linkedIn ?? ""} onChange={set("linkedIn")} placeholder="linkedin.com/in/you" />
        <TextField label="Website / GitHub" inputMode="url" value={c.website ?? ""} onChange={set("website")} placeholder="github.com/you" />
      </div>
    </CollapsibleSection>
  );
}
