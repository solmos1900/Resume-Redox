import type { ResumeVersion, SkillGroup } from "./schema";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "shall", "can", "need", "dare", "ought", "used",
  "we", "you", "they", "he", "she", "it", "our", "your", "their", "this",
  "that", "these", "those", "i", "my", "me", "us", "them", "who", "what",
  "which", "when", "where", "why", "how", "all", "each", "every", "both",
  "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "so", "than", "too", "very", "just", "about", "above",
  "after", "again", "against", "between", "into", "through", "during",
  "before", "after", "over", "under", "again", "further", "then", "once",
  "here", "there", "any", "work", "working", "role", "team", "company",
  "job", "description", "requirements", "qualifications", "responsibilities",
  "experience", "years", "year", "ability", "strong", "including", "preferred",
]);

export function extractJobTitle(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    const titleMatch = line.match(
      /^(?:job title|position|role)\s*[:\-–—]\s*(.+)$/i
    );
    if (titleMatch) return titleMatch[1].trim().slice(0, 60);

    if (
      line.length >= 8 &&
      line.length <= 60 &&
      !line.includes(".") &&
      !/^(about|overview|summary|description|requirements)/i.test(line)
    ) {
      const looksLikeTitle =
        /^[A-Z][A-Za-z0-9\s/&,\-–—()]+$/.test(line) &&
        line.split(/\s+/).length <= 8;
      if (looksLikeTitle) return line;
    }
  }

  return "Tailored Resume";
}

export function extractKeywords(text: string, limit = 25): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function reorderSkillItems(items: string, keywords: string[]): string {
  const parts = items
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return items;

  const scored = parts.map((skill) => {
    const lower = skill.toLowerCase();
    const score = keywords.reduce(
      (acc, kw) => (lower.includes(kw) ? acc + 1 : acc),
      0
    );
    return { skill, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.skill).join(", ");
}

export function tailorSkillsForJob(
  skillGroups: SkillGroup[],
  keywords: string[]
): SkillGroup[] {
  return skillGroups.map((group) => ({
    ...group,
    items: reorderSkillItems(group.items, keywords),
  }));
}

export function tailorResumeLocally(
  version: ResumeVersion,
  jobText: string
): Partial<ResumeVersion> {
  const keywords = extractKeywords(jobText);
  return {
    skillGroups: tailorSkillsForJob(version.skillGroups, keywords),
    jobDescription: {
      url: version.jobDescription?.url ?? "",
      text: jobText,
    },
  };
}

export type TailorApiResponse = {
  summary?: string;
  skillGroups?: SkillGroup[];
  experience?: ResumeVersion["experience"];
  suggestedName?: string;
  keywords?: string[];
};
