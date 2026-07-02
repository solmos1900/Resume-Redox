"use client";

import { ContactForm } from "./ContactForm";
import { SummaryForm } from "./SummaryForm";
import { ExperienceForm } from "./ExperienceForm";
import { SkillGroupsForm } from "./SkillGroupsForm";
import { EducationForm } from "./EducationForm";
import { JobDescriptionForm } from "./JobDescriptionForm";

export function EditorPanel() {
  return (
    <div className="space-y-4 p-4">
      <JobDescriptionForm />
      <ContactForm />
      <SummaryForm />
      <ExperienceForm />
      <SkillGroupsForm />
      <EducationForm />
    </div>
  );
}
