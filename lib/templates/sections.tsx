import type { ResumeContent } from "./types";
import type { CustomSection, Experience } from "@/lib/schema";
import {
  formatLinkedInDisplay,
  formatWebsiteDisplay,
} from "@/lib/contact-url";
import { formatCustomSectionTitle } from "@/lib/templates/ats-sections";
import { formatAtsPhone, formatDateRange, withAtsBullet } from "@/lib/utils";

export function useResumeSections(data: ResumeContent) {
  // Match PDF ContactLine: inline = primary pipes + URL line; stacked = labeled.
  const primary: string[] = [];
  const urls: string[] = [];
  const labeled: string[] = [];
  if (data.contact.phone?.trim()) {
    const phone = formatAtsPhone(data.contact.phone);
    primary.push(phone);
    labeled.push(`Phone: ${phone}`);
  }
  if (data.contact.email?.trim()) {
    primary.push(data.contact.email.trim());
    labeled.push(`Email: ${data.contact.email.trim()}`);
  }
  if (data.contact.location?.trim()) {
    primary.push(data.contact.location.trim());
    labeled.push(`Location: ${data.contact.location.trim()}`);
  }
  if (data.contact.linkedIn?.trim()) {
    const li = formatLinkedInDisplay(data.contact.linkedIn);
    urls.push(li);
    labeled.push(`LinkedIn: ${li}`);
  }
  if (data.contact.website?.trim()) {
    const web = formatWebsiteDisplay(data.contact.website);
    urls.push(web);
    labeled.push(`Website: ${web}`);
  }
  const contactLine =
    data.atsContactLayout === "stacked"
      ? labeled.join("\n")
      : [primary.join(" | "), urls.join(" | ")].filter(Boolean).join("\n");

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
          <h2 className={headingClassName}>
            {formatCustomSectionTitle(
              section.title,
              data.atsHeadingCase ?? "title"
            )}
          </h2>
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
            {/*
              Dates sit on the company line (standard US resume format). Keeping
              them off the title/bullet band avoids raw PDF extractors interleaving
              right-aligned dates between bullet lines.
            */}
            {(companyLine || dateRange) && (
              <div className="flex justify-between items-baseline gap-4">
                {companyLine ? (
                  <span className={companyClass}>{companyLine}</span>
                ) : (
                  <span />
                )}
                {dateRange && (
                  <span className={`${dateClass} whitespace-nowrap`}>
                    {dateRange}
                  </span>
                )}
              </div>
            )}
            {job.title.trim() && (
              <p className={`${titleClass} mt-0.5`}>{job.title}</p>
            )}
            {bullets.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {bullets.map((bullet, i) => (
                  <li key={i} className={bulletClass}>
                    {withAtsBullet(bullet)}
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
                    {withAtsBullet(item)}
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
            <div className="flex justify-between items-baseline gap-4">
              {edu.institution.trim() && (
                <span className={institutionClass}>{edu.institution}</span>
              )}
              {edu.location.trim() && (
                <span className={`${locationClass} whitespace-nowrap`}>
                  {edu.location}
                </span>
              )}
            </div>
            {(edu.details.trim() || edu.graduationDate.trim()) &&
              (detailsAsList && detailParts.length > 1 && !edu.graduationDate.trim() ? (
                <ul className="mt-1 space-y-0.5">
                  {detailParts.map((part, i) => (
                    <li key={i} className={detailsClass}>
                      {withAtsBullet(part)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex justify-between items-baseline gap-4 mt-0.5">
                  {edu.details.trim() ? (
                    <span className={detailsClass}>{edu.details}</span>
                  ) : (
                    <span />
                  )}
                  {edu.graduationDate.trim() && (
                    <span className={`${locationClass} whitespace-nowrap`}>
                      {edu.graduationDate}
                    </span>
                  )}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
