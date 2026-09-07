"use client";

import { useUiStore, type MobileTab } from "@/lib/ui-store";

const TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: "resumes", label: "Resumes", icon: "☰" },
  { id: "edit", label: "Edit", icon: "✎" },
  { id: "preview", label: "Preview", icon: "👁" },
];

export function MobileTabBar() {
  const mobileTab = useUiStore((s) => s.mobileTab);
  const setMobileTab = useUiStore((s) => s.setMobileTab);

  return (
    <nav
      className="no-print shrink-0 border-t border-gray-200 bg-white safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-3">
        {TABS.map((tab) => {
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors min-h-[52px] ${
                active
                  ? "text-gray-900 bg-gray-50"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base leading-none" aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
