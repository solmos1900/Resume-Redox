import type { ReactNode } from "react";
import type { Contact } from "@/lib/schema";
import {
  formatLinkedInDisplay,
  hasContactLineInfo,
  normalizeLinkedInUrl,
} from "@/lib/contact-url";
import { CONTACT_FIELD_SEPARATOR } from "@/lib/utils";

type ContactLineProps = {
  contact: Contact;
  className?: string;
};

/**
 * ATS-oriented contact line: phone | email | city/state | LinkedIn URL.
 * Pipe separators (not bullets) and a www.linkedin.com display URL help parsers.
 */
export function ContactLine({ contact, className }: ContactLineProps) {
  if (!hasContactLineInfo(contact)) return null;

  const segments: ReactNode[] = [];

  if (contact.phone?.trim()) {
    segments.push(<span key="phone">{contact.phone.trim()}</span>);
  }
  if (contact.email?.trim()) {
    const email = contact.email.trim();
    segments.push(
      <a key="email" href={`mailto:${email}`}>
        {email}
      </a>
    );
  }
  // Location before LinkedIn — city/state is a core ATS contact field.
  if (contact.location?.trim()) {
    segments.push(<span key="location">{contact.location.trim()}</span>);
  }
  if (contact.linkedIn?.trim()) {
    const linkedIn = contact.linkedIn.trim();
    const display = formatLinkedInDisplay(linkedIn);
    segments.push(
      contact.linkedInHyperlink ? (
        <a
          key="linkedin"
          href={normalizeLinkedInUrl(linkedIn)}
          data-pdf-link="linkedin"
          style={{ textDecoration: "underline" }}
        >
          {display}
        </a>
      ) : (
        <span key="linkedin">{display}</span>
      )
    );
  }

  return (
    <p className={className}>
      {segments.map((segment, index) => (
        <span key={index}>
          {index > 0 && CONTACT_FIELD_SEPARATOR}
          {segment}
        </span>
      ))}
    </p>
  );
}
