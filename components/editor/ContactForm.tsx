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

  // Order matches ATS contact block: phone, email, location, LinkedIn, website
  const fields = [
    { key: "fullName", label: "Full Name", placeholder: "Alex Rivera" },
    {
      key: "headline",
      label: "Headline / Target title",
      placeholder: "Senior Software Engineer | 7+ years | Platform",
    },
    { key: "phone", label: "Phone", placeholder: "(555) 234-0100" },
    { key: "email", label: "Email", placeholder: "you@email.com" },
    { key: "location", label: "Location (City, ST)", placeholder: "Austin, TX" },
    {
      key: "linkedIn",
      label: "LinkedIn",
      placeholder: "https://www.linkedin.com/in/your-profile",
    },
    {
      key: "website",
      label: "Website / GitHub",
      placeholder: "https://github.com/your-handle",
    },
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
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>
        ))}
        <p className="text-xs text-gray-500">
          Exports show labeled plain-text contact (Phone, Email, Location,
          LinkedIn, Website) so ATS parsers can read email and https URLs
          reliably.
        </p>
      </div>
    </CollapsibleSection>
  );
}
