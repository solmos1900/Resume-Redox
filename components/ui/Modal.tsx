"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconX } from "./icons";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Hide the × button (e.g. a choice the user must make). */
  hideClose?: boolean;
};

const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
} as const;

/**
 * Accessible dialog: bottom sheet on phones, centered card on larger screens.
 * Traps focus, closes on Esc / backdrop, restores focus on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideClose = false,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    requestAnimationFrame(() => {
      const first = panel?.querySelector<HTMLElement>("[data-autofocus]");
      (first ?? panel)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  // Portal to <body>: ancestors with backdrop-filter/transform would otherwise
  // become the containing block for this fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[92dvh] w-full animate-sheet-up flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-pop outline-none sm:rounded-[1.5rem] ${SIZES[size]}`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <div className="flex items-start gap-4 px-6 pb-2 pt-4 sm:pt-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-[22px] font-semibold leading-tight tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <button type="button" onClick={onClose} className="btn-icon -mr-2 -mt-1" aria-label="Close">
              <IconX />
            </button>
          )}
        </div>
        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 scrollbar-thin">
            {children}
          </div>
        )}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-paper/60 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
