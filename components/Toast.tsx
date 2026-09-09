"use client";

import { useToastStore } from "@/lib/toast-store";

/** Global polite live-region toast (post-import, etc.). */
export function AppToast() {
  const message = useToastStore((s) => s.message);
  const clearToast = useToastStore((s) => s.clearToast);

  if (!message) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 max-w-[min(24rem,calc(100vw-2rem))] px-4"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-3 rounded-xl bg-gray-900 text-white shadow-lg px-4 py-3 text-sm">
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={clearToast}
          className="shrink-0 min-h-[44px] min-w-[44px] rounded-lg hover:bg-gray-800 text-gray-300"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
