"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  sectionId?: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  sectionId,
  defaultOpen = true,
  action,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={sectionId}
      className="border border-gray-200 rounded-lg overflow-hidden scroll-mt-4 transition-shadow"
    >
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-gray-600"
        >
          <span className="text-xs">{open ? "▼" : "▶"}</span>
          {title}
        </button>
        {action}
      </div>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </section>
  );
}
