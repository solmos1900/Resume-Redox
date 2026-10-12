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
    updatedAt: now,
    contact: {
      fullName: "Alex Rivera",
      headline: "Technical Project Manager | Platform Delivery",
      phone: "(555) 234-0100",
      email: "alex.rivera@example.com",
      location: "Austin, TX",
      linkedIn: "linkedin.com/in/example",
      linkedInHyperlink: true,
    },
    summary:
      "Technical project manager with a software engineering background. Ships platform and integration work through clear roadmaps, release governance, and tight partnering with product and engineering.",
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
          "Delivered enterprise integrations across product, engineering, and security partners on agreed timelines from design through launch.",
          "Established release governance for a multi-service platform that clarified deployment ownership and dependency tracking.",
          "Cut recurring manual reporting effort by automating internal analytics used by leadership stakeholders.",
          "Unblocked engineering planning with clearer stories, acceptance criteria, and stakeholder updates each sprint.",
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
          "Saved operations analysts recurring hours by automating weekly data workflows.",
          "Accelerated incident investigation with internal tooling that surfaced real-time query results.",
          "Resolved production metric threshold issues by triaging alerts and coordinating engineer fixes.",
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
    customSections: [],
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
