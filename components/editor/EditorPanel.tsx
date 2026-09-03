"use client";

import { ContactForm } from "./ContactForm";
import { SummaryForm } from "./SummaryForm";
import { ExperienceForm } from "./ExperienceForm";
import {
  AddCustomSectionControls,
  CustomSectionsForm,
} from "./CustomSectionsForm";
import { SkillGroupsForm } from "./SkillGroupsForm";
import { EducationForm } from "./EducationForm";
import { JobDescriptionForm } from "./JobDescriptionForm";

export function EditorPanel() {
  return (
    <div className="space-y-4 p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <JobDescriptionForm />
      <ContactForm />
      <SummaryForm />
      <ExperienceForm />
      <CustomSectionsForm />
      <SkillGroupsForm />
      <EducationForm />
      <AddCustomSectionControls />
    </div>
  );
}
