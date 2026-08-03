"use client";

import type { TemplateId } from "@/lib/templates/types";
import type { ResumeContent } from "@/lib/templates/types";
import { ResumeTemplateSwitch } from "./ResumeTemplateSwitch";

type Props = {
  templateId: TemplateId;
  data: ResumeContent;
};

export function TemplateRenderer({ templateId, data }: Props) {
  return <ResumeTemplateSwitch templateId={templateId} data={data} />;
}
