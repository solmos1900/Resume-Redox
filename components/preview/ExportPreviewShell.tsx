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

    const triggerPrint = () => {
      window.print();
    };

    const timeout = window.setTimeout(triggerPrint, 400);
    return () => window.clearTimeout(timeout);
  }, [autoPrint, version]);

  return (
    <div id="resume-export-root" className="resume-export-root">
      <ResumeTemplateSwitch templateId={templateId} data={data} />
      {showTimestamp && exportedAt && (
        <ExportTimestamp exportedAt={exportedAt} />
      )}
    </div>
  );
}
