"use client";

import type { ReactNode } from "react";
import { useResumeStore } from "@/lib/store";
import { normalizeSectionOrder } from "@/lib/templates/section-order";
import type { ReorderableSectionId } from "@/lib/schema";
import { ContactForm } from "./ContactForm";
import { SummaryForm } from "./SummaryForm";
import { ExperienceForm } from "./ExperienceForm";
import { AddCustomSectionControls, CustomSectionsForm } from "./CustomSectionsForm";
import { SkillGroupsForm } from "./SkillGroupsForm";
import { EducationForm } from "./EducationForm";
import { EmptyResumeImportCta } from "@/components/import/EmptyResumeImportCta";

const SECTION_FORMS: Record<ReorderableSectionId, () => ReactNode> = {
  summary: () => <SummaryForm />,
  experience: () => <ExperienceForm />,
  custom: () => <CustomSectionsForm />,
  skills: () => <SkillGroupsForm />,
  education: () => <EducationForm />,
};

/** Content tab — sections appear in the same order as on the page. */
export function EditorPanel() {
  // Select the stored array (stable reference), normalize outside the selector.
  const storedOrder = useResumeStore((s) => s.getActiveVersion()?.sectionOrder);
  const order = normalizeSectionOrder(storedOrder);

  return (
    <div className="space-y-3">
      <EmptyResumeImportCta />
      <ContactForm />
      {order.map((id) => (
        <div key={id} className="contents">
          {SECTION_FORMS[id]()}
        </div>
      ))}
      <AddCustomSectionControls />
    </div>
  );
}
