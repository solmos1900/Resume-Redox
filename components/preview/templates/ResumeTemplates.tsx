import type { ReactNode } from "react";
import type { ResumeContent } from "@/lib/templates/types";
import { designDocumentProps } from "@/lib/design";
import { OrderedBodySections } from "@/lib/templates/ordered-sections";
import { ResumeMasthead } from "@/components/preview/ResumeMasthead";
import {
  formatCustomSectionTitle,
  getAtsSectionTitle,
  getAtsSummaryTitle,
} from "@/lib/templates/ats-sections";
import { withAtsBullet } from "@/lib/utils";
import {
  customSectionToExperience,
  CustomSectionBlocks,
  EducationBlock,
  ExperienceBlock,
  SkillsBlock,
  useResumeSections,
} from "@/lib/templates/sections";

/**
 * Section order: contact (pinned) → shared body order from version.sectionOrder.
 * Keep in sync with `lib/templates/section-order.ts` and export builders.
 * PDF reuses these components via Chromium; DOCX/TXT follow the same order.
 *
 * ATS notes:
 * - Masthead is a <div>, not <header> (parsers often skip header regions).
 * - Section titles are literal SUMMARY/EXPERIENCE/SKILLS/EDUCATION strings.
 * - Contact is labeled plain text with full https LinkedIn / website URLs.
 */
const articleClass =
  "resume-document bg-white text-black print:shadow-none";

/**
 * Heading chrome — label text comes from getAtsSectionTitle().
 * Modern/Executive intentionally share Classic's dark underlined left-aligned
 * headings: TheLadders missed Experience when Modern used gray text-xs titles
 * and Executive centered section headers (v4 regression).
 */
const headingClassic =
  "text-sm font-bold tracking-wide border-b border-gray-800 pb-1 mb-2";
const headingAtsSafe = headingClassic;
const headingModern = headingAtsSafe;
const headingProfessional = "text-sm font-bold text-gray-900 mb-1 border-b border-gray-300 pb-1";
const headingExecutive = headingAtsSafe;
const headingStructured =
  "text-sm font-bold bg-gray-100 px-2 py-1 mb-2 border-l-4 border-gray-800";

export function ClassicTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary, design, sectionOrder, atsContactLayout, atsSummaryKind, atsHeadingCase } =
    data;
  const { hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const designProps = designDocumentProps(design);

  return (
    <article
      id="resume-preview"
      className={`${articleClass} template-classic`}
      {...designProps}
    >
      <ResumeMasthead
        contact={contact}
        contactLayout={atsContactLayout}
        nameClassName="text-2xl font-bold tracking-wide uppercase"
        headlineClassName="text-sm font-medium text-gray-800 mt-1 leading-snug"
        contactClassName="text-sm text-gray-800 mt-2"
      />
      <OrderedBodySections
        order={sectionOrder}
        sections={{
          summary: hasSummary ? (
            <section className="mb-5">
              <h2 className={headingClassic}>{getAtsSummaryTitle(atsSummaryKind, atsHeadingCase)}</h2>
              <p className="text-sm leading-snug">{summary}</p>
            </section>
          ) : null,
          experience: hasExperience ? (
            <section className="mb-5">
              <h2 className={headingClassic}>{getAtsSectionTitle("experience", atsHeadingCase)}</h2>
              <ExperienceBlock
                data={data}
                jobSpacing="space-y-3.5"
                bulletClass="text-sm leading-[1.3]"
              />
            </section>
          ) : null,
          custom: (
            <CustomSectionBlocks
              data={data}
              headingClassName={headingClassic}
              sectionClassName="mb-5"
              experienceProps={{
                jobSpacing: "space-y-3.5",
                bulletClass: "text-sm leading-[1.3]",
              }}
            />
          ),
          skills: hasSkills ? (
            <section className="mb-5">
              <h2 className={headingClassic}>{getAtsSectionTitle("skills", atsHeadingCase)}</h2>
              <SkillsBlock data={data} />
            </section>
          ) : null,
          education: hasEducation ? (
            <section className="mb-5">
              <h2 className={headingClassic}>{getAtsSectionTitle("education", atsHeadingCase)}</h2>
              <EducationBlock data={data} />
            </section>
          ) : null,
        }}
      />
    </article>
  );
}

export function ModernTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary, design, sectionOrder, atsContactLayout, atsSummaryKind, atsHeadingCase } =
    data;
  const { hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const designProps = designDocumentProps(design);

  return (
    <article
      id="resume-preview"
      className={`${articleClass} leading-snug template-modern`}
      {...designProps}
    >
      <ResumeMasthead
        contact={contact}
        contactLayout={atsContactLayout}
        className="mb-5 pb-3 border-b border-gray-300"
        // Bold (not light) so parsers reliably detect the name line.
        nameClassName="text-2xl font-bold text-gray-900"
        headlineClassName="text-sm font-medium text-gray-800 mt-1 leading-snug"
        contactClassName="text-sm text-gray-800 mt-2"
      />
      <OrderedBodySections
        order={sectionOrder}
        sections={{
          summary: hasSummary ? (
            <section className="mb-5">
              <h2 className={headingModern}>{getAtsSummaryTitle(atsSummaryKind, atsHeadingCase)}</h2>
              <p className="text-sm text-gray-900 leading-snug">{summary}</p>
            </section>
          ) : null,
          experience: hasExperience ? (
            <section className="mb-5">
              <h2 className={headingModern}>{getAtsSectionTitle("experience", atsHeadingCase)}</h2>
              <ExperienceBlock
                data={data}
                jobSpacing="space-y-3.5"
                companyClass="text-sm font-semibold text-gray-900"
                titleClass="text-sm font-medium text-gray-800"
                bulletClass="text-sm leading-[1.35]"
              />
            </section>
          ) : null,
          custom: (
            <CustomSectionBlocks
              data={data}
              headingClassName={headingModern}
              sectionClassName="mb-5"
              experienceProps={{
                jobSpacing: "space-y-3.5",
                companyClass: "text-sm font-semibold text-gray-900",
                titleClass: "text-sm font-medium text-gray-800",
                bulletClass: "text-sm leading-[1.35]",
              }}
            />
          ),
          skills: hasSkills ? (
            <section className="mb-5">
              <h2 className={headingModern}>{getAtsSectionTitle("skills", atsHeadingCase)}</h2>
              <SkillsBlock
                data={data}
                labelClass="font-semibold text-gray-900"
                lineClass="text-sm text-gray-800"
              />
            </section>
          ) : null,
          education: hasEducation ? (
            <section className="mb-5">
              <h2 className={headingModern}>{getAtsSectionTitle("education", atsHeadingCase)}</h2>
              <EducationBlock
                data={data}
                institutionClass="text-sm font-semibold text-gray-900"
              />
            </section>
          ) : null,
        }}
      />
    </article>
  );
}

export function ProfessionalTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary, design, sectionOrder, atsContactLayout, atsSummaryKind, atsHeadingCase } =
    data;
  const { hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const designProps = designDocumentProps(design);

  return (
    <article
      id="resume-preview"
      className={`${articleClass} text-[13px] leading-snug template-professional`}
      {...designProps}
    >
      <ResumeMasthead
        contact={contact}
        contactLayout={atsContactLayout}
        className="mb-3.5"
        nameClassName="text-xl font-bold"
        headlineClassName="text-[13px] text-gray-700 mt-0.5 leading-snug"
        contactClassName="text-[13px] text-gray-800 mt-1"
      />
      <OrderedBodySections
        order={sectionOrder}
        sections={{
          summary: hasSummary ? (
            <section className="mb-3.5">
              <h2 className={headingProfessional}>{getAtsSummaryTitle(atsSummaryKind, atsHeadingCase)}</h2>
              <p className="text-[13px] leading-snug">{summary}</p>
            </section>
          ) : null,
          experience: hasExperience ? (
            <section className="mb-3.5">
              <h2 className={headingProfessional}>{getAtsSectionTitle("experience", atsHeadingCase)}</h2>
              <ExperienceBlock
                data={data}
                jobSpacing="space-y-2.5"
                companyClass="text-[13px] font-bold"
                titleClass="text-[13px]"
                dateClass="text-[13px] text-gray-700 shrink-0 ml-4"
                bulletClass="text-[13px] leading-[1.3]"
              />
            </section>
          ) : null,
          custom: (
            <CustomSectionBlocks
              data={data}
              headingClassName={headingProfessional}
              sectionClassName="mb-3.5"
              experienceProps={{
                jobSpacing: "space-y-2.5",
                companyClass: "text-[13px] font-bold",
                titleClass: "text-[13px]",
                dateClass: "text-[13px] text-gray-700 shrink-0 ml-4",
                bulletClass: "text-[13px] leading-[1.3]",
              }}
            />
          ),
          skills: hasSkills ? (
            <section className="mb-3.5">
              <h2 className={headingProfessional}>{getAtsSectionTitle("skills", atsHeadingCase)}</h2>
              <SkillsBlock data={data} lineClass="text-[13px]" />
            </section>
          ) : null,
          education: hasEducation ? (
            <section className="mb-3.5">
              <h2 className={headingProfessional}>{getAtsSectionTitle("education", atsHeadingCase)}</h2>
              <EducationBlock
                data={data}
                institutionClass="text-[13px] font-bold"
                locationClass="text-[13px] text-gray-700 shrink-0 ml-4"
                detailsClass="text-[13px] mt-0.5"
                entrySpacing="space-y-1.5"
              />
            </section>
          ) : null,
        }}
      />
    </article>
  );
}

export function ExecutiveTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary, design, sectionOrder, atsContactLayout, atsSummaryKind, atsHeadingCase } =
    data;
  const { hasSummary, hasExperience, hasSkills, hasEducation } =
    useResumeSections(data);
  const designProps = designDocumentProps(design);

  return (
    <article
      id="resume-preview"
      className={`${articleClass} template-executive`}
      {...designProps}
    >
      {/*
        Left-aligned masthead + body (not centered): TheLadders failed to find
        Experience on centered Executive v4 even though text was in the PDF.
      */}
      <ResumeMasthead
        contact={contact}
        contactLayout={atsContactLayout}
        align="left"
        nameClassName="text-2xl font-bold tracking-wide"
        headlineClassName="text-sm font-medium text-gray-800 mt-1.5 leading-snug"
        contactClassName="text-sm text-gray-800 mt-2"
      />
      <OrderedBodySections
        order={sectionOrder}
        sections={{
          summary: hasSummary ? (
            <section className="mb-5">
              <h2 className={headingExecutive}>{getAtsSummaryTitle(atsSummaryKind, atsHeadingCase)}</h2>
              <p className="text-sm leading-snug text-gray-900 max-w-none">
                {summary}
              </p>
            </section>
          ) : null,
          experience: hasExperience ? (
            <section className="mb-5">
              <h2 className={headingExecutive}>{getAtsSectionTitle("experience", atsHeadingCase)}</h2>
              <ExperienceBlock
                data={data}
                companyClass="text-sm font-semibold"
                titleClass="text-sm font-medium not-italic"
                jobSpacing="space-y-3.5"
                bulletClass="text-sm leading-[1.35]"
              />
            </section>
          ) : null,
          custom: (
            <CustomSectionBlocks
              data={data}
              headingClassName={headingExecutive}
              sectionClassName="mb-5"
              experienceProps={{
                companyClass: "text-sm font-semibold",
                titleClass: "text-sm font-medium not-italic",
                jobSpacing: "space-y-3.5",
                bulletClass: "text-sm leading-[1.35]",
              }}
            />
          ),
          skills: hasSkills ? (
            <section className="mb-5">
              <h2 className={headingExecutive}>{getAtsSectionTitle("skills", atsHeadingCase)}</h2>
              <SkillsBlock data={data} />
            </section>
          ) : null,
          education: hasEducation ? (
            <section className="mb-5">
              <h2 className={headingExecutive}>{getAtsSectionTitle("education", atsHeadingCase)}</h2>
              <EducationBlock data={data} />
            </section>
          ) : null,
        }}
      />
    </article>
  );
}

export function StructuredTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary, design, sectionOrder, atsContactLayout, atsSummaryKind, atsHeadingCase } =
    data;
  const {
    hasSummary,
    hasExperience,
    hasSkills,
    hasEducation,
    visibleCustomSections,
  } = useResumeSections(data);
  const designProps = designDocumentProps(design);

  return (
    <article
      id="resume-preview"
      className={`${articleClass} template-structured`}
      {...designProps}
    >
      <ResumeMasthead
        contact={contact}
        contactLayout={atsContactLayout}
        className="mb-5 pb-3 border-b-2 border-gray-800"
        nameClassName="text-2xl font-bold"
        headlineClassName="text-sm text-gray-700 mt-1 leading-snug"
        contactClassName="text-sm text-gray-700 mt-1.5"
      />
      <OrderedBodySections
        order={sectionOrder}
        sections={{
          summary: hasSummary ? (
            <section className="mb-5">
              <h2 className={headingStructured}>{getAtsSummaryTitle(atsSummaryKind, atsHeadingCase)}</h2>
              <p className="text-sm leading-snug pl-2">{summary}</p>
            </section>
          ) : null,
          experience: hasExperience ? (
            <section className="mb-5">
              <h2 className={headingStructured}>{getAtsSectionTitle("experience", atsHeadingCase)}</h2>
              <div className="pl-2">
                <ExperienceBlock
                  data={data}
                  jobSpacing="space-y-3.5"
                  bulletClass="text-sm leading-[1.3]"
                />
              </div>
            </section>
          ) : null,
          custom:
            visibleCustomSections.length > 0 ? (
              <>
                {visibleCustomSections.map((section) => (
                  <section key={section.id} className="mb-5">
                    <h2 className={headingStructured}>
                      {formatCustomSectionTitle(section.title, atsHeadingCase)}
                    </h2>
                    <div className="pl-2">
                      <ExperienceBlock
                        data={data}
                        experience={customSectionToExperience(section)}
                        jobSpacing="space-y-3.5"
                        bulletClass="text-sm leading-[1.3]"
                      />
                    </div>
                  </section>
                ))}
              </>
            ) : null,
          skills: hasSkills ? (
            <section className="mb-5">
              <h2 className={headingStructured}>{getAtsSectionTitle("skills", atsHeadingCase)}</h2>
              <div className="pl-2">
                <SkillsBlock
                  data={data}
                  bulleted
                  labelClass="font-bold uppercase text-xs tracking-wide"
                />
              </div>
            </section>
          ) : null,
          education: hasEducation ? (
            <section className="mb-5">
              <h2 className={headingStructured}>{getAtsSectionTitle("education", atsHeadingCase)}</h2>
              <div className="pl-2">
                <EducationBlock
                  data={data}
                  detailsAsList
                  detailsClass="text-sm"
                />
              </div>
            </section>
          ) : null,
        }}
      />
    </article>
  );
}

const accentArticleClass =
  "resume-document template-accent bg-white text-gray-900 print:shadow-none";

function AccentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 accent-section">
      <h2 className="accent-section-title">{title}</h2>
      {children}
    </section>
  );
}

export function AccentTemplate({ data }: { data: ResumeContent }) {
  const { contact, summary, design, sectionOrder, atsContactLayout, atsSummaryKind, atsHeadingCase } =
    data;
  const {
    hasSummary,
    hasExperience,
    hasSkills,
    hasEducation,
    visibleCustomSections,
  } = useResumeSections(data);
  const designProps = designDocumentProps(design);

  return (
    <article
      id="resume-preview"
      className={accentArticleClass}
      {...designProps}
    >
      <ResumeMasthead
        contact={contact}
        contactLayout={atsContactLayout}
        nameClassName="text-[21px] font-bold tracking-wide text-gray-900 uppercase leading-none"
        headlineClassName="accent-headline text-sm mt-0.5 leading-snug"
        contactClassName="text-sm text-gray-800 mt-2"
      />
      <OrderedBodySections
        order={sectionOrder}
        sections={{
          summary: hasSummary ? (
            <AccentSection title={getAtsSummaryTitle(atsSummaryKind, atsHeadingCase)}>
              <p className="text-sm leading-snug text-gray-800">{summary}</p>
            </AccentSection>
          ) : null,
          experience: hasExperience ? (
            <AccentSection title={getAtsSectionTitle("experience", atsHeadingCase)}>
              <ExperienceBlock
                data={data}
                jobSpacing="space-y-3"
                companyClass="text-sm font-bold text-gray-900"
                titleClass="text-sm font-medium text-gray-800 not-italic"
                dateClass="text-sm text-gray-700 shrink-0 ml-4"
                bulletClass="text-sm leading-[1.3] text-gray-800"
              />
            </AccentSection>
          ) : null,
          custom:
            visibleCustomSections.length > 0 ? (
              <>
                {visibleCustomSections.map((section) => (
                  <AccentSection
                    key={section.id}
                    title={formatCustomSectionTitle(section.title, atsHeadingCase)}
                  >
                    <ExperienceBlock
                      data={data}
                      experience={customSectionToExperience(section)}
                      jobSpacing="space-y-3"
                      companyClass="text-sm font-bold text-gray-900"
                      titleClass="text-sm font-medium text-gray-800 not-italic"
                      dateClass="text-sm text-gray-700 shrink-0 ml-4"
                      bulletClass="text-sm leading-[1.3] text-gray-800"
                    />
                  </AccentSection>
                ))}
              </>
            ) : null,
          skills: hasSkills ? (
            <AccentSection title={getAtsSectionTitle("skills", atsHeadingCase)}>
              <div className="space-y-1.5">
                {data.skillGroups.map((group) => {
                  if (!group.category.trim() && !group.items.trim()) return null;
                  return (
                    <p
                      key={group.id}
                      className="text-sm leading-[1.3] text-gray-800"
                    >
                      {group.category.trim() && (
                        <span className="font-semibold text-gray-900">
                          {group.category}:{" "}
                        </span>
                      )}
                      {group.items.trim()}
                    </p>
                  );
                })}
              </div>
            </AccentSection>
          ) : null,
          education: hasEducation ? (
            <AccentSection title={getAtsSectionTitle("education", atsHeadingCase)}>
              <div className="space-y-2">
                {data.education.map((edu) => {
                  if (!edu.institution.trim() && !edu.details.trim()) return null;
                  const detailParts = edu.details
                    .split(",")
                    .map((part) => part.trim())
                    .filter(Boolean);
                  const degree = detailParts[0] ?? "";
                  const extras = detailParts.slice(1);

                  return (
                    <div key={edu.id}>
                      <div className="flex justify-between items-baseline gap-4">
                        {edu.institution.trim() && (
                          <span className="text-sm font-bold text-gray-900">
                            {edu.institution}
                          </span>
                        )}
                        {edu.location.trim() && (
                          <span className="text-sm text-gray-700 shrink-0 whitespace-nowrap">
                            {edu.location}
                          </span>
                        )}
                      </div>
                      {(degree || edu.graduationDate.trim()) && (
                        <div className="flex justify-between items-baseline gap-4 mt-0.5">
                          {degree ? (
                            <span className="text-sm leading-[1.3] text-gray-800">
                              {degree}
                            </span>
                          ) : (
                            <span />
                          )}
                          {edu.graduationDate.trim() && (
                            <span className="text-sm text-gray-700 shrink-0 whitespace-nowrap">
                              {edu.graduationDate}
                            </span>
                          )}
                        </div>
                      )}
                      {extras.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {extras.map((part, index) => (
                            <li key={index} className="text-sm text-gray-800">
                              {withAtsBullet(part)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </AccentSection>
          ) : null,
        }}
      />
    </article>
  );
}
