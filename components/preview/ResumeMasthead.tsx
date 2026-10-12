import type { Contact } from "@/lib/schema";
import { ContactLine } from "@/components/preview/ContactLine";

type ResumeMastheadProps = {
  contact: Contact;
  /** Visual wrappers for name / headline / contact. */
  className?: string;
  nameClassName?: string;
  headlineClassName?: string;
  contactClassName?: string;
  /** stacked (default) or inline labeled contact. */
  contactLayout?: "stacked" | "inline";
  /**
   * Some templates center the masthead. Name casing stays as entered unless
   * nameClassName adds uppercase for visual style.
   */
  align?: "left" | "center";
};

/**
 * Name + headline + contact. Uses a <div>, not <header>: several ATS tools
 * drop or partially skip PDF/HTML header regions when reading contact fields.
 */
export function ResumeMasthead({
  contact,
  className = "mb-5",
  nameClassName,
  headlineClassName,
  contactClassName = "text-sm text-gray-800 mt-1",
  contactLayout = "stacked",
  align = "left",
}: ResumeMastheadProps) {
  if (!contact.fullName.trim()) return null;

  const alignClass = align === "center" ? "text-center" : "";

  return (
    <div className={`${className} ${alignClass}`.trim()}>
      <h1 className={nameClassName}>{contact.fullName}</h1>
      {contact.headline?.trim() && (
        <p className={headlineClassName}>{contact.headline}</p>
      )}
      <ContactLine
        contact={contact}
        className={contactClassName}
        layout={contactLayout}
      />
    </div>
  );
}
