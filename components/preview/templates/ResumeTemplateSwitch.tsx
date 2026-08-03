import type { TemplateId } from "@/lib/templates/types";
import type { ResumeContent } from "@/lib/templates/types";
import {
  ClassicTemplate,
  ModernTemplate,
  ProfessionalTemplate,
  ExecutiveTemplate,
  StructuredTemplate,
  AccentTemplate,
} from "./ResumeTemplates";

type Props = {
  templateId: TemplateId;
  data: ResumeContent;
};

export function ResumeTemplateSwitch({ templateId, data }: Props) {
  switch (templateId) {
    case "modern":
      return <ModernTemplate data={data} />;
    case "professional":
      return <ProfessionalTemplate data={data} />;
    case "executive":
      return <ExecutiveTemplate data={data} />;
    case "structured":
      return <StructuredTemplate data={data} />;
    case "accent":
      return <AccentTemplate data={data} />;
    case "classic":
    default:
      return <ClassicTemplate data={data} />;
  }
}
