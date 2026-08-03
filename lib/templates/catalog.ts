import type { TemplateDefinition } from "./types";

export const TEMPLATE_CATALOG: TemplateDefinition[] = [
  {
    id: "classic",
    name: "Classic ATS",
    tagline: "Traditional & parser-friendly",
    description:
      "Bold section headers with underline dividers. The safest default for most applicant tracking systems.",
    atsNotes: [
      "Single column",
      "Standard section headings",
      "Semantic HTML lists",
    ],
  },
  {
    id: "modern",
    name: "Modern Clean",
    tagline: "Minimal & readable",
    description:
      "Left-aligned layout with generous whitespace. Clean typography without decorative elements.",
    atsNotes: [
      "System fonts only",
      "Plain contact line",
      "No tables or columns",
    ],
  },
  {
    id: "professional",
    name: "Compact Professional",
    tagline: "Dense & efficient",
    description:
      "Tighter spacing for candidates with extensive experience. Fits more content on one page.",
    atsNotes: [
      "Linear text flow",
      "Grouped skills as text",
      "Consistent date format",
    ],
  },
  {
    id: "executive",
    name: "Executive Formal",
    tagline: "Centered & authoritative",
    description:
      "Centered name and contact block with formal section treatment. Strong first impression for senior roles.",
    atsNotes: [
      "No graphics or icons",
      "Standard h1/h2 hierarchy",
      "Print-safe layout",
    ],
  },
  {
    id: "structured",
    name: "Clear Structure",
    tagline: "Strong visual hierarchy",
    description:
      "Full-width section rules and clear labels. Easy for recruiters and parsers to scan quickly.",
    atsNotes: [
      "Explicit section labels",
      "Bullet lists preserved",
      "Black text on white",
    ],
  },
  {
    id: "accent",
    name: "Accent Clean",
    tagline: "Colored headers & readable",
    description:
      "Inspired by modern PM resumes: bold name, accent-blue section headers, headline tagline, and clean single-column flow that's easy to scan.",
    atsNotes: [
      "Single column",
      "System fonts",
      "Accent color on headings only",
    ],
  },
];

export function getTemplateById(id: string): TemplateDefinition {
  return (
    TEMPLATE_CATALOG.find((t) => t.id === id) ?? TEMPLATE_CATALOG[0]
  );
}
