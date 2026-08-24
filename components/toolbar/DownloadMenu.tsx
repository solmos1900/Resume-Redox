"use client";

import { useEffect, useRef, useState } from "react";
import type { ResumeVersion } from "@/lib/schema";
import { downloadResumeAsPdf } from "@/lib/export-pdf";
import { downloadResumeAsDocx } from "@/lib/export-docx";
import { downloadResumeAsText } from "@/lib/export-text";

type Format = "pdf" | "docx" | "txt";

const FORMATS: { id: Format; label: string }[] = [
  { id: "pdf", label: "PDF Document (.pdf)" },
  { id: "docx", label: "Word Document (.docx)" },
  { id: "txt", label: "Plain Text (.txt)" },
];

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-4 h-4"
      aria-hidden
    >
      <path
        d="M10 3v9m0 0 3.5-3.5M10 12l-3.5-3.5M4 14v1.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  version: ResumeVersion | undefined;
  onStatus: (message: string) => void;
};

export function DownloadMenu({ version, onStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Format | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleDownload = async (format: Format) => {
    if (!version || pending) return;
    setPending(format);
    try {
      if (format === "pdf") {
        await downloadResumeAsPdf(version);
      } else if (format === "docx") {
        await downloadResumeAsDocx(version);
      } else {
        downloadResumeAsText(version);
      }
      onStatus(`Downloaded ${FORMATS.find((f) => f.id === format)?.label}.`);
      setOpen(false);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!version}
        className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 font-medium"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <DownloadIcon />
        Download
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40"
        >
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              role="menuitem"
              onClick={() => void handleDownload(format.id)}
              disabled={pending !== null}
              className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50 disabled:opacity-40 flex items-center justify-between"
            >
              {format.label}
              {pending === format.id && (
                <span className="text-xs text-gray-400">…</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
