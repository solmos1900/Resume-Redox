"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type MenuProps = {
  /** Render prop for the trigger; spread `props` onto a <button>. */
  trigger: (props: {
    onClick: () => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
  }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: string;
  /** Open upward (e.g. near the bottom of the screen). */
  placement?: "bottom" | "top";
};

/** Lightweight popover menu: outside-click + Esc to close. */
export function Menu({
  trigger,
  children,
  align = "right",
  width = "w-64",
  placement = "bottom",
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      {trigger({
        onClick: () => setOpen((v) => !v),
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })}
      {open && (
        <div
          role="menu"
          className={`absolute z-50 ${width} animate-fade-up overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-pop ${
            align === "right" ? "right-0" : "left-0"
          } ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  hint,
  onClick,
  disabled,
  danger,
  trailing,
}: {
  icon?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-paper focus-visible:bg-paper focus-visible:outline-none disabled:opacity-40 ${
        danger ? "text-red-700" : "text-ink"
      }`}
    >
      {icon && (
        <span className={`mt-0.5 shrink-0 ${danger ? "text-red-600" : "text-ink-muted"}`}>{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{hint}</span>}
      </span>
      {trailing}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-line" role="separator" />;
}
