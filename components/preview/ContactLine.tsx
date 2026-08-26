import type { ReactNode } from "react";
import type { Contact } from "@/lib/schema";
import {
  hasContactLineInfo,
  normalizeLinkedInUrl,
} from "@/lib/contact-url";

type ContactLineProps = {
  contact: Contact;
  className?: string;
};

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
  if (contact.linkedIn?.trim()) {
    const linkedIn = contact.linkedIn.trim();
    segments.push(
      contact.linkedInHyperlink ? (
        <a
          key="linkedin"
          href={normalizeLinkedInUrl(linkedIn)}
          style={{ textDecoration: "underline" }}
        >
          {linkedIn}
        </a>
      ) : (
        <span key="linkedin">{linkedIn}</span>
      )
    );
  }
  if (contact.location?.trim()) {
    segments.push(<span key="location">{contact.location.trim()}</span>);
  }

  return (
    <p className={className}>
      {segments.map((segment, index) => (
        <span key={index}>
          {index > 0 && " • "}
          {segment}
        </span>
      ))}
    </p>
  );
}
