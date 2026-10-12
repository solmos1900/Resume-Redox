import {
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_SECTION_ORDER,
  type ResumeVersion,
} from "./schema";

/** Demo seed only — no real personal data. */
export function createSeedVersion(): ResumeVersion {
  const now = new Date().toISOString();
  return {
    id: "seed-technical-pm",
    name: "Technical PM (Demo)",
    templateId: "classic" as const,
    design: { ...DEFAULT_DESIGN_SETTINGS },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    atsContactLayout: "stacked",
    atsSummaryHeading: "SUMMARY",
    updatedAt: now,
    contact: {
      fullName: "Alex Rivera",
      headline: "Technical Project Manager | 5+ years | Platform Delivery",
      phone: "+1 555 234 0100",
      email: "alex.rivera@example.com",
      location: "Austin, TX",
      linkedIn: "https://www.linkedin.com/in/example",
      website: "https://github.com/example",
      linkedInHyperlink: true,
    },
    summary:
      "Technical Project Manager with 5+ years leading platform and integration delivery. Combines a software engineering background with roadmapping, release governance, and cross-functional execution for reliable launches.",
    experience: [
      {
        id: "exp-demo-tpm",
        company: "Northwind Systems",
        location: "Austin, TX",
        title: "Software Engineer → Technical Project Manager",
        startDate: "Jan 2022",
        endDate: "",
        current: true,
        bullets: [
          "Delivered 12 enterprise integrations across product, engineering, and security on agreed launch dates.",
          "Established release governance for a multi-service platform that clarified deployment ownership for 6 teams.",
          "Cut recurring manual reporting by 8 hours/week by automating internal analytics for leadership.",
          "Unblocked sprint planning with clearer stories, acceptance criteria, and stakeholder updates.",
        ],
      },
      {
        id: "exp-demo-intern",
        company: "Northwind Systems",
        location: "Austin, TX",
        title: "Software Engineering Intern",
        startDate: "Jun 2021",
        endDate: "Aug 2021",
        current: false,
        bullets: [
          "Saved operations analysts 6 hours/week by automating recurring data workflows.",
          "Accelerated incident investigation with tooling that surfaced real-time query results.",
          "Resolved 15 production metric-threshold alerts by coordinating engineer fixes within SLA.",
        ],
      },
    ],
    skillGroups: [
      {
        id: "skill-delivery",
        category: "Delivery & Strategy",
        items:
          "TPM, Roadmapping, Backlog Management, Agile/Scrum, Release Governance, Risk Management",
      },
      {
        id: "skill-stakeholder",
        category: "Stakeholder & Governance",
        items:
          "Cross-functional Alignment, Architecture Reviews, Stakeholder Management, Compliance Coordination",
      },
      {
        id: "skill-engineering",
        category: "Engineering",
        items: "Python, SQL, JavaScript, React, REST APIs",
      },
      {
        id: "skill-data",
        category: "Data & Analytics",
        items: "Dashboards, Automated Reporting, Data Pipelines, Schema Design",
      },
      {
        id: "skill-tools",
        category: "Tools & Platforms",
        items: "Jira, Confluence, Git, Slack Workflows",
      },
    ],
    education: [
      {
        id: "edu-demo",
        institution: "State University",
        location: "Austin, TX",
        details: "B.S. Computer Science",
        graduationDate: "May 2021",
      },
    ],
    customSections: [
      {
        id: "custom-certs",
        title: "Certifications",
        entries: [
          {
            id: "cert-1",
            name: "Certified ScrumMaster (CSM)",
            location: "",
            subtitle: "Scrum Alliance",
            startDate: "",
            endDate: "2023",
            current: false,
            bullets: ["Credential ID demo-csm-0001"],
          },
        ],
      },
    ],
    jobDescription: { url: "", text: "" },
    aiRecommendations: [],
    aiMeta: {},
  };
}

export function createInitialStore() {
  const seed = createSeedVersion();
  return {
    activeVersionId: seed.id,
    versions: [seed],
  };
}
