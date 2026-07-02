import type {
  Contact,
  Education,
  Experience,
  SkillGroup,
  ResumeVersion,
  TemplateId,
} from "@/lib/schema";

export type { TemplateId };

export type ResumeContent = {
  contact: Contact;
  summary: string;
  experience: Experience[];
  skillGroups: SkillGroup[];
  education: Education[];
};

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  atsNotes: string[];
};

export function toResumeContent(version: ResumeVersion): ResumeContent {
  return {
    contact: version.contact,
    summary: version.summary,
    experience: version.experience,
    skillGroups: version.skillGroups,
    education: version.education,
  };
}
