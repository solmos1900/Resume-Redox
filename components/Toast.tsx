"use client";

import { useToastStore } from "@/lib/toast-store";
import { IconX } from "@/components/ui/icons";

/** Global polite live-region toast. */
export function AppToast() {
  const message = useToastStore((s) => s.message);
  const clearToast = useToastStore((s) => s.clearToast);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[80] flex justify-center px-4 lg:bottom-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message && (
        <div className="pointer-events-auto flex max-w-md animate-sheet-up items-center gap-2 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-sm text-paper shadow-pop">
          <span className="flex-1 py-1">{message}</span>
          <button
            type="button"
            onClick={clearToast}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-paper/60 hover:bg-white/10 hover:text-paper"
            aria-label="Dismiss"
          >
            <IconX size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
