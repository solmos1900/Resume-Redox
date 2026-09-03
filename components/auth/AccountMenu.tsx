"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

/** Only ever mounted inside AuthGate, so `user` is always present here. */
export function AccountMenu() {
  const { user, signOutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!user) return null;

  const label = user.displayName || user.email || "Account";
  const initial = label.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 text-sm px-2 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Account menu"
      >
        <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold shrink-0">
          {initial}
        </span>
        <span className="hidden sm:inline max-w-[140px] truncate text-gray-700">
          {label}
        </span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              void signOutUser();
            }}
            className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50 text-red-600"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
