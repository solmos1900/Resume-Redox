"use client";

import { useEffect, useState } from "react";
import { ResumeTemplateSwitch } from "@/components/preview/templates/ResumeTemplateSwitch";
import { ExportTimestamp } from "@/components/preview/ExportTimestamp";
import type { TemplateId } from "@/lib/schema";
import { toResumeContent } from "@/lib/templates/types";
import type { ResumeVersion } from "@/lib/schema";
import { getExportFilename, type ExportSessionOptions } from "@/lib/export";
import { downloadResumeAsPdf } from "@/lib/export-pdf";

type Props = {
  version: ResumeVersion;
  options?: ExportSessionOptions;
  autoPrint?: boolean;
  autoDownloadPdf?: boolean;
};

export function ExportPreviewShell({
  version,
  options,
  autoPrint = false,
  autoDownloadPdf = false,
}: Props) {
  const data = toResumeContent(version);
  const templateId = (version.templateId ?? "classic") as TemplateId;
  const exportedAt = options?.exportedAt;
  const showTimestamp = options?.includeTimestampOnResume === true;
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "working" | "done" | "error"
  >("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoPrint || autoDownloadPdf) return;

    document.title = getExportFilename(version);

    // Strip query string so Safari/Chrome headers & footers don't stamp the
    // long ?token=… Vercel preview URL onto the PDF if the user leaves them on.
    try {
      window.history.replaceState(null, "", "/export/preview");
    } catch {
      // ignore
    }

    const triggerPrint = () => {
      window.print();
    };

    const timeout = window.setTimeout(triggerPrint, 400);
    return () => window.clearTimeout(timeout);
  }, [autoPrint, autoDownloadPdf, version]);

  useEffect(() => {
    if (!autoDownloadPdf) return;

    document.title = getExportFilename(version);
    setDownloadStatus("working");
    setDownloadError(null);

    let cancelled = false;

    const run = async () => {
      // Wait a beat for fonts/layout to settle before rasterizing.
      await new Promise((r) => window.setTimeout(r, 500));
      if (cancelled) return;
      try {
        await downloadResumeAsPdf(version);
        if (!cancelled) setDownloadStatus("done");
      } catch (error) {
        if (!cancelled) {
          setDownloadStatus("error");
          setDownloadError(
            error instanceof Error ? error.message : "PDF download failed."
          );
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [autoDownloadPdf, version]);

  return (
    <>
      {(autoDownloadPdf || autoPrint) && (
        <div className="no-print export-status-banner">
          {autoDownloadPdf && downloadStatus === "working" && (
            <p>Preparing a clean PDF (no browser headers or site toolbar)…</p>
          )}
          {autoDownloadPdf && downloadStatus === "done" && (
            <p>
              PDF downloaded. You can close this tab.
              <span className="block text-gray-500 mt-1 text-xs">
                Tip: for ATS text parsing, also keep a .docx copy from Download.
              </span>
            </p>
          )}
          {autoDownloadPdf && downloadStatus === "error" && (
            <p className="text-red-700">
              {downloadError ?? "PDF download failed."}
            </p>
          )}
          {autoPrint && (
            <p>
              Print dialog opening… In the dialog, turn off{" "}
              <strong>Headers and footers</strong> (and set margins to None /
              Default) so the page URL and date don’t appear on the resume.
            </p>
          )}
        </div>
      )}

      <div id="resume-export-root" className="resume-export-root">
        <ResumeTemplateSwitch templateId={templateId} data={data} />
        {showTimestamp && exportedAt && (
          <ExportTimestamp exportedAt={exportedAt} />
        )}
      </div>
    </>
  );
}
