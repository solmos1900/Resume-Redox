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
   * inline (default) = pipe-separated values; URLs on a second line so
   * https://www.linkedin.com/in/... never soft-wraps mid-slug.
   * stacked = labeled lines (Phone: … / Email: … / LinkedIn: …)
   */
  layout?: "stacked" | "inline";
};

type ContactField = { label: string; value: string; isUrl?: boolean };

function buildContactFields(contact: Contact): ContactField[] {
  const fields: ContactField[] = [];

  if (contact.phone?.trim()) {
    fields.push({ label: "Phone", value: contact.phone.trim() });
  }
  if (contact.email?.trim()) {
    fields.push({ label: "Email", value: contact.email.trim() });
  }
  if (contact.location?.trim()) {
    fields.push({ label: "Location", value: contact.location.trim() });
  }
  if (contact.linkedIn?.trim()) {
    fields.push({
      label: "LinkedIn",
      value: formatLinkedInDisplay(contact.linkedIn),
      isUrl: true,
    });
  }
  if (contact.website?.trim()) {
    fields.push({
      label: "Website",
      value: formatWebsiteDisplay(contact.website),
      isUrl: true,
    });
  }

  return fields;
}

function joinPipe(fields: ContactField[]) {
  return fields.map((f) => f.value).join(" | ");
}

/**
 * ATS-oriented contact block — plain text only.
 * Default: phone | email | location, then a second line with full https URLs.
 */
export function ContactLine({
  contact,
  className,
  layout = "inline",
}: ContactLineProps) {
  if (!hasContactLineInfo(contact)) return null;

  const fields = buildContactFields(contact);
  if (fields.length === 0) return null;

  if (layout === "inline") {
    const primary = fields.filter((f) => !f.isUrl);
    const urls = fields.filter((f) => f.isUrl);
    return (
      <div className={className}>
        {primary.length > 0 && (
          <p className="leading-snug">{joinPipe(primary)}</p>
        )}
        {urls.length > 0 && (
          <p className="leading-snug" style={{ overflowWrap: "normal" }}>
            {urls.map((field, index) => (
              <span key={field.label} style={{ whiteSpace: "nowrap" }}>
                {index > 0 && " | "}
                {field.value}
              </span>
            ))}
          </p>
        )}
      </div>
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
