"use client";

import { useResumeStore } from "@/lib/store";
import { toResumeContent } from "@/lib/templates/types";
import type { TemplateId } from "@/lib/templates/types";
import { TemplateRenderer } from "./templates/TemplateRenderer";

export function ResumePreview() {
  const version = useResumeStore((s) => s.getActiveVersion());

  if (!version) {
    return (
      <div className="p-8 text-gray-500 text-sm">No resume version selected.</div>
    );
  }

  const data = toResumeContent(version);
  const templateId = (version.templateId ?? "classic") as TemplateId;

  return <TemplateRenderer templateId={templateId} data={data} />;
}
