import type { ResumeContent } from "@/lib/templates/types";
import {
  EducationBlock,
  ExperienceBlock,
  SkillsBlock,
  useResumeSections,
} from "@/lib/templates/sections";

const articleClass =
  "resume-document bg-white text-black mx-auto shadow-lg print:shadow-none";

export function ClassicTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary } = data;
  const { contactLine, hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const heading =
    "text-sm font-bold uppercase tracking-wider border-b border-gray-800 pb-1 mb-2";

  return (
    <article id="resume-preview" className={articleClass}>
      {contact.fullName.trim() && (
        <header className="mb-4">
          <h1 className="text-2xl font-bold tracking-wide uppercase">
            {contact.fullName}
          </h1>
          {contactLine && (
            <p className="text-sm text-gray-800 mt-1">{contactLine}</p>
          )}
        </header>
      )}
      {hasSummary && (
        <section className="mb-4">
          <h2 className={heading}>Summary</h2>
          <p className="text-sm leading-relaxed">{summary}</p>
        </section>
      )}
      {hasExperience && (
        <section className="mb-4">
          <h2 className={heading}>Experience</h2>
          <ExperienceBlock data={data} />
        </section>
      )}
      {hasSkills && (
        <section className="mb-4">
          <h2 className={heading}>Skills</h2>
          <SkillsBlock data={data} />
        </section>
      )}
      {hasEducation && (
        <section>
          <h2 className={heading}>Education</h2>
          <EducationBlock data={data} />
        </section>
      )}
    </article>
  );
}

export function ModernTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary } = data;
  const { contactLine, hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const heading = "text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2";

  return (
    <article id="resume-preview" className={`${articleClass} leading-relaxed`}>
      {contact.fullName.trim() && (
        <header className="mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-light text-gray-900">
            {contact.fullName}
          </h1>
          {contactLine && (
            <p className="text-sm text-gray-600 mt-2">{contactLine}</p>
          )}
        </header>
      )}
      {hasSummary && (
        <section className="mb-6">
          <h2 className={heading}>Summary</h2>
          <p className="text-sm text-gray-800 leading-relaxed">{summary}</p>
        </section>
      )}
      {hasExperience && (
        <section className="mb-6">
          <h2 className={heading}>Experience</h2>
          <ExperienceBlock
            data={data}
            jobSpacing="space-y-5"
            titleClass="text-sm font-medium text-gray-800"
          />
        </section>
      )}
      {hasSkills && (
        <section className="mb-6">
          <h2 className={heading}>Skills</h2>
          <SkillsBlock data={data} labelClass="font-medium text-gray-800" />
        </section>
      )}
      {hasEducation && (
        <section>
          <h2 className={heading}>Education</h2>
          <EducationBlock
            data={data}
            institutionClass="text-sm font-medium text-gray-800"
          />
        </section>
      )}
    </article>
  );
}

export function ProfessionalTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary } = data;
  const { contactLine, hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const heading = "text-sm font-bold text-gray-900 mb-1";

  return (
    <article
      id="resume-preview"
      className={`${articleClass} text-[13px] leading-snug`}
    >
      {contact.fullName.trim() && (
        <header className="mb-3">
          <h1 className="text-xl font-bold">{contact.fullName}</h1>
          {contactLine && (
            <p className="text-[13px] text-gray-800 mt-0.5">{contactLine}</p>
          )}
        </header>
      )}
      {hasSummary && (
        <section className="mb-3">
          <h2 className={heading}>Summary</h2>
          <p className="text-[13px] leading-snug">{summary}</p>
        </section>
      )}
      {hasExperience && (
        <section className="mb-3">
          <h2 className={heading}>Experience</h2>
          <ExperienceBlock
            data={data}
            jobSpacing="space-y-3"
            companyClass="text-[13px] font-bold"
            titleClass="text-[13px]"
            dateClass="text-[13px] text-gray-700 shrink-0 ml-4"
            bulletClass="text-[13px] leading-snug"
          />
        </section>
      )}
      {hasSkills && (
        <section className="mb-3">
          <h2 className={heading}>Skills</h2>
          <SkillsBlock data={data} lineClass="text-[13px]" />
        </section>
      )}
      {hasEducation && (
        <section>
          <h2 className={heading}>Education</h2>
          <EducationBlock
            data={data}
            institutionClass="text-[13px] font-bold"
            locationClass="text-[13px] text-gray-700 shrink-0 ml-4"
            detailsClass="text-[13px] mt-0.5"
            entrySpacing="space-y-1.5"
          />
        </section>
      )}
    </article>
  );
}

export function ExecutiveTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary } = data;
  const { contactLine, hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const heading =
    "text-sm font-bold uppercase text-center tracking-widest border-b border-gray-400 pb-1 mb-3 mt-1";

  return (
    <article id="resume-preview" className={articleClass}>
      {contact.fullName.trim() && (
        <header className="mb-5 text-center">
          <h1 className="text-2xl font-bold tracking-wide">
            {contact.fullName}
          </h1>
          {contactLine && (
            <p className="text-sm text-gray-700 mt-2">{contactLine}</p>
          )}
        </header>
      )}
      {hasSummary && (
        <section className="mb-5">
          <h2 className={heading}>Professional Summary</h2>
          <p className="text-sm leading-relaxed text-center max-w-none">
            {summary}
          </p>
        </section>
      )}
      {hasExperience && (
        <section className="mb-5">
          <h2 className={heading}>Professional Experience</h2>
          <ExperienceBlock
            data={data}
            titleClass="text-sm font-semibold not-italic"
          />
        </section>
      )}
      {hasSkills && (
        <section className="mb-5">
          <h2 className={heading}>Core Competencies</h2>
          <SkillsBlock data={data} />
        </section>
      )}
      {hasEducation && (
        <section>
          <h2 className={heading}>Education</h2>
          <EducationBlock data={data} />
        </section>
      )}
    </article>
  );
}

export function StructuredTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary } = data;
  const { contactLine, hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const heading =
    "text-sm font-bold uppercase bg-gray-100 px-2 py-1 mb-2 border-l-4 border-gray-800";

  return (
    <article id="resume-preview" className={articleClass}>
      {contact.fullName.trim() && (
        <header className="mb-4 pb-3 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold">{contact.fullName}</h1>
          {contactLine && (
            <p className="text-sm text-gray-700 mt-1.5">{contactLine}</p>
          )}
        </header>
      )}
      {hasSummary && (
        <section className="mb-4">
          <h2 className={heading}>Summary</h2>
          <p className="text-sm leading-relaxed pl-2">{summary}</p>
        </section>
      )}
      {hasExperience && (
        <section className="mb-4">
          <h2 className={heading}>Experience</h2>
          <div className="pl-2">
            <ExperienceBlock data={data} />
          </div>
        </section>
      )}
      {hasSkills && (
        <section className="mb-4">
          <h2 className={heading}>Skills</h2>
          <div className="pl-2">
            <SkillsBlock data={data} bulleted labelClass="font-bold uppercase text-xs tracking-wide" />
          </div>
        </section>
      )}
      {hasEducation && (
        <section>
          <h2 className={heading}>Education</h2>
          <div className="pl-2">
            <EducationBlock
              data={data}
              detailsAsList
              detailsClass="text-sm"
            />
          </div>
        </section>
      )}
    </article>
  );
}
