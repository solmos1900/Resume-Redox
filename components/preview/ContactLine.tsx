import type { Contact } from "@/lib/schema";
import {
  formatLinkedInDisplay,
  formatWebsiteDisplay,
  hasContactLineInfo,
} from "@/lib/contact-url";

type ContactLineProps = {
  contact: Contact;
  className?: string;
  /**
   * stacked = each field on its own labeled line (best for many ATS parsers).
   * inline = labeled fields on one/two compact lines.
   */
  layout?: "stacked" | "inline";
};

type ContactField = { label: string; value: string };

function buildContactFields(contact: Contact): ContactField[] {
  const fields: ContactField[] = [];

  if (contact.phone?.trim()) {
    fields.push({ label: "Phone", value: contact.phone.trim() });
  }
  if (contact.email?.trim()) {
    // Plain text — not a mailto: link. Hyperlinks in the masthead confuse
    // several ATS checkers (including freecvaudit's "professional link" scan).
    fields.push({ label: "Email", value: contact.email.trim() });
  }
  if (contact.location?.trim()) {
    fields.push({ label: "Location", value: contact.location.trim() });
  }
  if (contact.linkedIn?.trim()) {
    fields.push({
      label: "LinkedIn",
      value: formatLinkedInDisplay(contact.linkedIn),
    });
  }
  if (contact.website?.trim()) {
    fields.push({
      label: "Website",
      value: formatWebsiteDisplay(contact.website),
    });
  }

  return fields;
}

/**
 * ATS-oriented contact block.
 * - Labeled Phone / Email / Location / LinkedIn / Website
 * - Plain text only (no <a href>) so parsers see the literal email + https URL
 * - Full https://linkedin.com/in/... visible in the text layer
 */
export function ContactLine({
  contact,
  className,
  layout = "stacked",
}: ContactLineProps) {
  if (!hasContactLineInfo(contact)) return null;

  const fields = buildContactFields(contact);
  if (fields.length === 0) return null;

  if (layout === "inline") {
    return (
      <p className={className}>
        {fields.map((field, index) => (
          <span key={field.label}>
            {index > 0 && " | "}
            {field.label}: {field.value}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className={className}>
      {fields.map((field) => (
        <p key={field.label} className="leading-snug">
          {field.label}: {field.value}
        </p>
      ))}
    </div>
  );
}
