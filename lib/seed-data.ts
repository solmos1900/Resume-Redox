import type { ResumeVersion } from "./schema";

export function createSeedVersion(): ResumeVersion {
  const now = new Date().toISOString();
  return {
    id: "seed-technical-pm",
    name: "Technical PM",
    templateId: "classic" as const,
    updatedAt: now,
    contact: {
      fullName: "Alex Rivera",
      headline: "",
      phone: "+1 (555) 010-2000",
      email: "alex.rivera@example.com",
      location: "Austin, TX",
      linkedIn: "linkedin.com/in/example",
    },
    summary:
      "Technical project manager and software engineer at Northwind Systems driving delivery of enterprise integration and data platforms. Led end-to-end execution across 8 cross-functional integrations involving 40+ stakeholders, built a scalable analytics platform automating reporting for 79,000+ colleagues, and established operational models adopted across product, engineering, architecture, and InfoSec teams. Combines hands-on engineering depth with TPM execution skills — roadmapping, stakeholder alignment, governance coordination, and release planning — to bridge the gap between technical strategy and business outcomes.",
    experience: [
      {
        id: "exp-amex-tpm",
        company: "Northwind Systems",
        location: "Austin, TX",
        title: "Software Engineer I → Technical Project Manager",
        startDate: "Sept 2023",
        endDate: "",
        current: true,
        bullets: [
          "Serve as primary technical lead and SME for enterprise integrations involving 40+ stakeholders across India, U.S., and global teams; own architecture reviews, API onboarding readiness, and cross-functional delivery from design through implementation.",
          "Design and implement Northwind API ecosystem documentation including lifecycle diagrams, access processes, and a centralized SharePoint Integrations Hub; created framework adopted across all future integrations.",
          "Led Unified Workspace Data & Analytics (UWDA) platform for 24 months as both TPM and technical contributor, eliminating manual Intune-based device tracking via Python ingestion services pulling Microsoft Graph, JAMF, and ADSI data; designed 10-table schema and 3 automated pipelines reducing recurring manual work by 15+ hours per release.",
          "Own release governance for 80+ services; facilitate weekly release syncs, 2 PM infrastructure partner meetings, and deployment accountability processes that reduced last-minute escalations and deployment risk.",
          "Built operational dashboards used by 8+ teams for alert tracking, vulnerability management, and runbook-driven Slack nudges via Power Automate; led cross-team discussions on EventDB expansion and Concur modernization.",
          "Drive early-stage discovery conversations and feature definition sessions; produce story artifacts and one-off materials for stakeholder alignment.",
          "Developed and tracked 5 critical customer-centric metrics on Voice of Customer team including active issue resolution and full-stack Slackbot (Python, Flask, pyodbc) returning real-time SQL query responses; identified threshold breaches and triaged production bugs.",
        ],
      },
      {
        id: "exp-amex-intern",
        company: "Northwind Systems",
        location: "Austin, TX",
        title: "Software Engineering Intern",
        startDate: "Jun 2022",
        endDate: "Aug 2022",
        current: false,
        bullets: [
          "Automated recurring data extraction workflows reducing manual reporting effort for the Voice of Customer team.",
          "Built a full-stack Slackbot using Python, Flask, and pyodbc to return real-time SQL query responses for incident investigation.",
          "Identified threshold breaches in production metrics and triaged bugs to improve incident response time.",
        ],
      },
    ],
    skillGroups: [
      {
        id: "skill-delivery",
        category: "Delivery & Strategy",
        items:
          "TPM, Roadmapping, Backlog Management, Agile/Scrum, PI Planning, Release Governance, Risk Management",
      },
      {
        id: "skill-stakeholder",
        category: "Stakeholder & Governance",
        items:
          "Cross-functional Alignment, Architecture Reviews, InfoSec Coordination, API Onboarding, Stakeholder Management, Compliance",
      },
      {
        id: "skill-engineering",
        category: "Engineering",
        items:
          "Python, SQL, JavaScript, React, REST APIs, Power Automate, Microsoft Graph API, Flask",
      },
      {
        id: "skill-data",
        category: "Data & Analytics",
        items:
          "Power BI, Pandas, MSSQL, Automated Reporting Pipelines, Data Ingestion, Schema Design",
      },
      {
        id: "skill-tools",
        category: "Tools & Platforms",
        items:
          "Jira, Confluence, SharePoint, Git, Hydra, JAMF, BAYA, ELF, Intune, ADSI",
      },
    ],
    education: [
      {
        id: "edu-iowa",
        institution:
          "State University",
        location: "Austin, TX",
        details:
          "B.B.A. Computer Science, Entrepreneurship Certificate",
        graduationDate: "May 2023",
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
