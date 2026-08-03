import type { ResumeVersion } from "./schema";

/** Demo seed only — no real personal data. */
export function createSeedVersion(): ResumeVersion {
  const now = new Date().toISOString();
  return {
    id: "seed-technical-pm",
    name: "Technical PM (Demo)",
    templateId: "classic" as const,
    updatedAt: now,
    contact: {
      fullName: "Alex Rivera",
      headline: "Technical Project Manager | Platform Delivery",
      phone: "+1 (555) 010-2000",
      email: "alex.rivera@example.com",
      location: "Austin, TX",
      linkedIn: "linkedin.com/in/example",
    },
    summary:
      "Technical project manager with a software engineering background, focused on cross-functional delivery of platform and integration work. Experienced in roadmapping, stakeholder alignment, release governance, and partnering with product and engineering teams to ship reliable outcomes.",
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
          "Lead delivery for enterprise integrations across product, engineering, and security partners; own timelines, risks, and readiness from design through launch.",
          "Established release governance for a multi-service platform, including weekly syncs, dependency tracking, and clearer deployment ownership.",
          "Built internal analytics automation that reduced recurring manual reporting and improved visibility for leadership stakeholders.",
          "Facilitate planning and refinement with engineering teams; produce clear stories, acceptance criteria, and stakeholder updates.",
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
          "Automated recurring data workflows that reduced manual reporting effort for an operations team.",
          "Built internal tooling to surface real-time query results for incident investigation.",
          "Triaged production metric thresholds and coordinated bug fixes with engineers.",
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
