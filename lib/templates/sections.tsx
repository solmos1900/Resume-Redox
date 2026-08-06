import type { ResumeContent } from "./types";
import type { CustomSection, Experience } from "@/lib/schema";
import { formatContactLine, formatDateRange } from "@/lib/utils";

export function useResumeSections(data: ResumeContent) {
  const contactLine = formatContactLine([
    data.contact.phone,
    data.contact.email,
    data.contact.linkedIn,
    data.contact.location,
  ]);

  const hasSummary = data.summary.trim().length > 0;
  const hasExperience = data.experience.some(
    (e) => e.company.trim() || e.title.trim() || e.bullets.some((b) => b.trim())
  );
  const hasSkills = data.skillGroups.some(
    (g) => g.category.trim() || g.items.trim()
  );
  const hasEducation = data.education.some(
    (e) => e.institution.trim() || e.details.trim()
  );
  const visibleCustomSections = (data.customSections ?? []).filter((section) =>
    section.entries.some(
      (e) =>
        e.name.trim() ||
        e.subtitle.trim() ||
        e.bullets.some((b) => b.trim())
    )
  );

  return {
    contactLine,
    hasSummary,
    hasExperience,
    hasSkills,
    hasEducation,
    visibleCustomSections,
    formatDateRange,
  };
}

export function customSectionToExperience(section: CustomSection): Experience[] {
  return section.entries.map((entry) => ({
    id: entry.id,
    company: entry.name,
    location: entry.location,
    title: entry.subtitle,
    startDate: entry.startDate,
    endDate: entry.endDate,
    current: entry.current,
    bullets: entry.bullets,
  }));
}

type ExperienceBlockProps = {
  companyClass?: string;
  titleClass?: string;
  dateClass?: string;
  bulletClass?: string;
  jobSpacing?: string;
};

export function CustomSectionBlocks({
  data,
  sectionClassName = "mb-4",
  headingClassName,
  experienceProps,
}: {
  data: ResumeContent;
  sectionClassName?: string;
  headingClassName: string;
  experienceProps?: ExperienceBlockProps;
}) {
  const { visibleCustomSections } = useResumeSections(data);
  if (visibleCustomSections.length === 0) return null;

  return (
    <>
      {visibleCustomSections.map((section) => (
        <section key={section.id} className={sectionClassName}>
          <h2 className={headingClassName}>{section.title.trim() || "Section"}</h2>
          <ExperienceBlock
            data={data}
            experience={customSectionToExperience(section)}
            {...experienceProps}
          />
        </section>
      ))}
    </>
  );
}

export function ExperienceBlock({
  data,
  experience,
  companyClass = "text-sm font-semibold",
  titleClass = "text-sm italic",
  dateClass = "text-sm text-gray-700 shrink-0 ml-4",
  bulletClass = "text-sm leading-snug",
  jobSpacing = "space-y-4",
}: {
  data: ResumeContent;
  experience?: Experience[];
  companyClass?: string;
  titleClass?: string;
  dateClass?: string;
  bulletClass?: string;
  jobSpacing?: string;
}) {
  const { formatDateRange } = useResumeSections(data);
  const jobs = experience ?? data.experience;

  return (
    <div className={jobSpacing}>
      {jobs.map((job) => {
        const companyLine = [job.company, job.location]
          .filter((s) => s.trim())
          .join(", ");
        const dateRange = formatDateRange(
          job.startDate,
          job.endDate,
          job.current
        );
        const bullets = job.bullets.filter((b) => b.trim());
        if (!companyLine && !job.title.trim() && bullets.length === 0) {
          return null;
        }
        return (
          <div key={job.id}>
            {companyLine && <p className={companyClass}>{companyLine}</p>}
            {(job.title.trim() || dateRange) && (
              <div className="flex justify-between mt-0.5">
                {job.title.trim() && <span className={titleClass}>{job.title}</span>}
                {dateRange && <span className={dateClass}>{dateRange}</span>}
              </div>
            )}
            {bullets.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {bullets.map((bullet, i) => (
                  <li key={i} className={bulletClass}>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SkillsBlock({
  data,
  lineClass = "text-sm",
  labelClass = "font-semibold",
  bulleted = false,
}: {
  data: ResumeContent;
  lineClass?: string;
  labelClass?: string;
  bulleted?: boolean;
}) {
  return (
    <div className={bulleted ? "space-y-2" : "space-y-1"}>
      {data.skillGroups.map((group) => {
        if (!group.category.trim() && !group.items.trim()) return null;

        if (bulleted && group.items.trim()) {
          const items = group.items
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          return (
            <div key={group.id}>
              {group.category.trim() && (
                <p className={`${lineClass} ${labelClass} mb-1`}>
                  {group.category}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item, i) => (
                  <li key={i} className={lineClass}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <p key={group.id} className={lineClass}>
            {group.category.trim() && (
              <span className={labelClass}>{group.category}: </span>
            )}
            {group.items.trim()}
          </p>
        );
      })}
    </div>
  );
}

export function EducationBlock({
  data,
  institutionClass = "text-sm font-semibold",
  locationClass = "text-sm text-gray-700 shrink-0 ml-4",
  detailsClass = "text-sm mt-0.5",
  entrySpacing = "space-y-2",
  detailsAsList = false,
}: {
  data: ResumeContent;
  institutionClass?: string;
  locationClass?: string;
  detailsClass?: string;
  entrySpacing?: string;
  detailsAsList?: boolean;
}) {
  return (
    <div className={entrySpacing}>
      {data.education.map((edu) => {
        if (!edu.institution.trim() && !edu.details.trim()) return null;
        const detailParts = edu.details
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return (
          <div key={edu.id}>
            <div className="flex justify-between">
              {edu.institution.trim() && (
                <span className={institutionClass}>{edu.institution}</span>
              )}
              {edu.location.trim() && (
                <span className={locationClass}>{edu.location}</span>
              )}
            </div>
            {(edu.details.trim() || edu.graduationDate.trim()) &&
              (detailsAsList && detailParts.length > 1 && !edu.graduationDate.trim() ? (
                <ul className="mt-1 space-y-0.5">
                  {detailParts.map((part, i) => (
                    <li key={i} className={detailsClass}>
                      {part}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex justify-between mt-0.5">
                  {edu.details.trim() ? (
                    <span className={detailsClass}>{edu.details}</span>
                  ) : (
                    <span />
                  )}
                  {edu.graduationDate.trim() && (
                    <span className={locationClass}>{edu.graduationDate}</span>
                  )}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
