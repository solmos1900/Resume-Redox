"use client";

import { useResumeStore } from "@/lib/store";
import { CollapsibleSection } from "./CollapsibleSection";

export function ContactForm() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;

  const updateContact = (field: string, value: string) => {
    updateActiveVersion({
      contact: { ...version.contact, [field]: value },
    });
  };

  const toggleLinkedInHyperlink = (checked: boolean) => {
    updateActiveVersion({
      contact: { ...version.contact, linkedInHyperlink: checked },
    });
  };

  const fields = [
    { key: "fullName", label: "Full Name", placeholder: "Alex Rivera" },
    {
      key: "headline",
      label: "Headline / Tagline",
      placeholder: "Technical PM | Platform Delivery | Integrations",
    },
    { key: "phone", label: "Phone", placeholder: "+1 (555) 010-2000" },
    { key: "email", label: "Email", placeholder: "you@email.com" },
    { key: "linkedIn", label: "LinkedIn", placeholder: "linkedin.com/in/..." },
    { key: "location", label: "Location", placeholder: "Austin, TX" },
  ] as const;

  return (
    <CollapsibleSection
      title="Contact"
      sectionId="editor-section-contact"
    >
      <div className="grid gap-3">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block">
              <span className="text-xs font-medium text-gray-600">{label}</span>
              <input
                type="text"
                value={version.contact[key] ?? ""}
                onChange={(e) => updateContact(key, e.target.value)}
                placeholder={placeholder}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            {key === "linkedIn" && (
              <label className="mt-1.5 flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={version.contact.linkedInHyperlink}
                  onChange={(e) => toggleLinkedInHyperlink(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Make this a clickable link
              </label>
            )}
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
