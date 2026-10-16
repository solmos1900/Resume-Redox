"use client";

import { useState } from "react";
import type { ResumeVersion } from "@/lib/schema";
import { downloadResumeAsPdf, PdfServiceUnavailableError } from "@/lib/export-pdf";
import { downloadResumeAsDocx } from "@/lib/export-docx";
import { downloadResumeAsText } from "@/lib/export-text";
import { createPrintSession, openPrintPreview } from "@/lib/export";
import { useToastStore } from "@/lib/toast-store";
import { useAuth } from "@/components/auth/AuthProvider";
import { Menu, MenuDivider, MenuItem } from "@/components/ui/Menu";
import { Modal } from "@/components/ui/Modal";
import { IconChevronDown, IconDownload, IconFile, IconPrinter } from "@/components/ui/icons";

type Format = "pdf" | "docx" | "txt";

function openPrintView(version: ResumeVersion) {
  const token = createPrintSession(version);
  openPrintPreview(token);
}

/**
 * Every format is free and needs no account. PDF is rendered server-side
 * (selectable text, embedded fonts); if that service is unavailable we fall
 * back to the browser's own Save-as-PDF on the identical print view.
 */
export function DownloadMenu({ version, compact = false }: { version: ResumeVersion | undefined; compact?: boolean }) {
  const { getServerToken } = useAuth();
  const showToast = useToastStore((s) => s.showToast);
  const [pending, setPending] = useState<Format | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const run = async (format: Format) => {
    if (!version || pending) return;
    setPending(format);
    try {
      if (format === "pdf") {
        showToast("Preparing your PDF…", 20_000);
        await downloadResumeAsPdf(version, await getServerToken());
        showToast("PDF downloaded. Good luck out there!");
      } else if (format === "docx") {
        await downloadResumeAsDocx(version);
        showToast("Word document downloaded.");
      } else {
        downloadResumeAsText(version);
        showToast("Plain-text file downloaded.");
      }
    } catch (error) {
      if (error instanceof PdfServiceUnavailableError) {
        useToastStore.getState().clearToast();
        setFallbackOpen(true);
      } else {
        showToast(error instanceof Error ? error.message : "Download failed. Please try again.");
      }
    } finally {
      setPending(null);
    }
  };

  const print = () => {
    if (!version) return;
    try {
      openPrintView(version);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't open the print view.");
    }
  };

  return (
    <>
      <Menu
        width="w-[19rem]"
        trigger={(props) => (
          <button
            type="button"
            {...props}
            disabled={!version || pending !== null}
            className={`btn btn-brand ${compact ? "h-10 w-10 px-0" : "pl-4 pr-3"}`}
            aria-label="Download"
          >
            <IconDownload size={17} />
            {!compact && (
              <>
                <span>{pending ? "Preparing…" : "Download"}</span>
                <IconChevronDown size={15} className="opacity-80" />
              </>
            )}
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem
              icon={<IconFile />}
              label={
                <span className="flex items-center gap-2">
                  PDF
                  <span className="rounded-full bg-moss-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-moss-700">
                    Best
                  </span>
                </span>
              }
              hint="Looks exactly like the preview. Use this to apply."
              onClick={() => {
                close();
                void run("pdf");
              }}
            />
            <MenuItem
              icon={<IconFile />}
              label="Word (.docx)"
              hint="For sites that ask for Word. Simple, parser-friendly layout."
              onClick={() => {
                close();
                void run("docx");
              }}
            />
            <MenuItem
              icon={<IconFile />}
              label="Plain text (.txt)"
              hint="For pasting into online application forms."
              onClick={() => {
                close();
                void run("txt");
              }}
            />
            <MenuDivider />
            <MenuItem
              icon={<IconPrinter />}
              label="Print"
              onClick={() => {
                close();
                print();
              }}
            />
            <p className="px-3 pb-1.5 pt-2 text-[11px] text-ink-faint">Free, unlimited, no watermark.</p>
          </>
        )}
      </Menu>

      <Modal
        open={fallbackOpen}
        onClose={() => setFallbackOpen(false)}
        size="sm"
        title="Save your PDF from the print view"
        description="Our PDF service is busy right now, so let's use your browser — same layout, real selectable text."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setFallbackOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-autofocus
              onClick={() => {
                setFallbackOpen(false);
                print();
              }}
            >
              Open print view
            </button>
          </>
        }
      >
        <ol className="space-y-2.5 text-sm text-ink-soft">
          {[
            <>Click <b>Open print view</b> below.</>,
            <>Set <b>Destination</b> to <b>Save as PDF</b>.</>,
            <>Under <b>More settings</b>, turn off <b>Headers and footers</b>.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-deep text-xs font-semibold text-ink">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}
