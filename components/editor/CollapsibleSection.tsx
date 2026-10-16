"use client";

import { useState, type ReactNode } from "react";
import { IconCheck, IconChevronDown } from "@/components/ui/icons";

type Props = {
  title: string;
  /** One line telling the user what good looks like for this section. */
  description?: string;
  sectionId?: string;
  defaultOpen?: boolean;
  /** Shows a green check when the section has content. */
  complete?: boolean;
  action?: ReactNode;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  description,
  sectionId,
  defaultOpen = true,
  complete,
  action,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={sectionId} className="scroll-mt-4 rounded-2xl border border-line bg-white/70 shadow-[0_1px_0_rgba(26,24,21,0.03)]">
      <div className="flex items-center gap-2 pr-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex min-h-[60px] min-w-0 flex-1 items-center gap-3 px-4 text-left touch-manipulation"
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
              complete ? "border-moss-500 bg-moss-500 text-white" : "border-line-strong bg-white text-transparent"
            }`}
            aria-hidden
          >
            <IconCheck size={13} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[17px] font-semibold tracking-tight text-ink">{title}</span>
            {description && !open && (
              <span className="block truncate text-xs text-ink-muted">{description}</span>
            )}
          </span>
          <IconChevronDown size={18} className={`shrink-0 text-ink-faint transition ${open ? "rotate-180" : ""}`} />
          <span className="sr-only">{complete ? "(has content)" : "(empty)"}</span>
        </button>
        {action}
      </div>
      {open && (
        <div className="space-y-3 px-4 pb-4">
          {description && <p className="-mt-1 text-[13px] leading-relaxed text-ink-muted">{description}</p>}
          {children}
        </div>
      )}
    </section>
  );
}
