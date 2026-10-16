"use client";

import { useEffect } from "react";
import { ResumeTemplateSwitch } from "@/components/preview/templates/ResumeTemplateSwitch";
import { ExportTimestamp } from "@/components/preview/ExportTimestamp";
import type { TemplateId } from "@/lib/schema";
import { toResumeContent } from "@/lib/templates/types";
import type { ResumeVersion } from "@/lib/schema";
import { getExportFilename, type ExportSessionOptions } from "@/lib/export";

type Props = {
  version: ResumeVersion;
  options?: ExportSessionOptions;
  autoPrint?: boolean;
};

/**
 * Browser print preview shell. Download → PDF uses /api/export-pdf
 * (Chromium text PDF of the same templates) instead of this path.
 */
export function ExportPreviewShell({
  version,
  options,
  autoPrint = false,
}: Props) {
  const data = toResumeContent(version);
  const templateId = (version.templateId ?? "classic") as TemplateId;
  const exportedAt = options?.exportedAt;
  const showTimestamp = options?.includeTimestampOnResume === true;

  useEffect(() => {
    if (!autoPrint) return;

    document.title = getExportFilename(version);

    // Strip query string so Safari/Chrome headers & footers don't stamp the
    // long ?token=… Vercel preview URL onto the PDF if the user leaves them on.
    try {
      window.history.replaceState(null, "", "/export/preview");
    } catch {
      // ignore
    }

    const timeout = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timeout);
  }, [autoPrint, version]);

  return (
    <>
      {autoPrint && (
        <div className="no-print export-status-banner">
          <p>
            Your print dialog is opening. To save a PDF, set{" "}
            <strong>Destination → Save as PDF</strong>, then under More
            settings turn off <strong>Headers and footers</strong> so the page
            URL and date don&apos;t appear on your resume.
          </p>
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
