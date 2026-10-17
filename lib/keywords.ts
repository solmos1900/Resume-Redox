import type { ResumeVersion } from "./schema";

/**
 * Free, deterministic job-description keyword check (no AI, runs locally).
 * Pulls the most repeated meaningful terms from a posting and reports which
 * already appear in the resume.
 */

const STOPWORDS = new Set(
  `a about above across after again against all also am an and any are as at be because been before being below
  between both but by can could did do does doing down during each either etc few for from further had has have having
  he her here hers him his how i if in into is it its itself just me more most my no nor not of off on once only or
  other our ours out over own same she should so some such than that the their theirs them then there these they this
  those through to too under until up us very was we were what when where which while who whom why will with within
  without would you your yours yourself
  ability able across additional apply applicants applicant benefits best candidate candidates company compensation
  day days degree desired environment equal etc excellent experience experienced familiarity fast field help high
  ideal include including job join key knowledge least level like looking make must new opportunity opportunities
  paced part people per plus position preferred qualifications related required requirements responsibilities role
  salary skills strong success successful team teams time understanding using well work working world year years
  you'll we're you're it's who'll what's get great good across based both bonus build building closely create
  ensure etc want wants way ways us usa within across range including inc llc ltd
  one two three four five six seven eight nine ten first second
  will can may might shall
  senior junior mid principal staff
  hiring hire hired run running define defining own owning drive driving partner partnering support supporting
  helping seeking seek wanted love passionate thrive thrives grow growing enjoy excited exciting
  remote hybrid onsite office location locations full-time part-time contract`.split(/\s+/).filter(Boolean)
);

const TOKEN_RE = /[a-z0-9][a-z0-9+#./-]*[a-z0-9+#]|[a-z0-9]/g;

function tokens(text: string): string[] {
  return (text.toLowerCase().match(TOKEN_RE) ?? []).map((t) => t.replace(/[./-]+$/, ""));
}

function isUseful(token: string): boolean {
  if (STOPWORDS.has(token)) return false;
  if (/^\d+$/.test(token)) return false;
  if (token.length < 2) return false;
  // Two-letter tokens only when they look like tech (e.g. "ai", "ml", "go" is too ambiguous).
  if (token.length === 2 && !["ai", "ml", "ui", "ux", "qa", "bi", "ci", "cd", "c#", "r"].includes(token)) return false;
  return true;
}

function stem(token: string): string {
  if (token.length > 4 && token.endsWith("ies")) return token.slice(0, -3) + "y";
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

export type KeywordReport = {
  keywords: { term: string; matched: boolean; count: number }[];
  matchedCount: number;
  total: number;
  /** 0–100 */
  score: number;
};

export function resumeToPlainText(version: ResumeVersion): string {
  const parts: string[] = [
    version.contact.headline ?? "",
    version.summary,
    ...version.experience.flatMap((e) => [e.title, e.company, ...e.bullets]),
    ...version.skillGroups.flatMap((g) => [g.category, g.items]),
    ...version.education.flatMap((e) => [e.institution, e.details]),
    ...(version.customSections ?? []).flatMap((s) => [
      s.title,
      ...s.entries.flatMap((e) => [e.name, e.subtitle, ...e.bullets]),
    ]),
  ];
  return parts.join("\n");
}

/** Words written as proper nouns / acronyms mid-sentence (SQL, Kubernetes, Figma). */
function properNounStems(text: string): Set<string> {
  const out = new Set<string>();
  const re = /(^|[^.!?:\n]\s)([A-Z][A-Za-z0-9+#.]*[A-Za-z0-9+#])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.add(stem(m[2].toLowerCase()));
  for (const acronym of text.match(/\b[A-Z]{2,}[A-Z0-9+#]*\b/g) ?? []) out.add(stem(acronym.toLowerCase()));
  return out;
}

export function extractKeywords(jobText: string, limit = 20): { term: string; count: number }[] {
  const words = tokens(jobText);
  const proper = properNounStems(jobText);
  const counts = new Map<string, { term: string; count: number }>();

  const bump = (key: string, term: string, weight = 1) => {
    const prev = counts.get(key);
    if (prev) prev.count += weight;
    else counts.set(key, { term, count: weight });
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!isUseful(w)) continue;
    bump(stem(w), w);
    const next = words[i + 1];
    if (next && isUseful(next)) {
      bump(`${stem(w)} ${stem(next)}`, `${w} ${next}`);
    }
  }

  const all = [...counts.entries()].map(([key, v]) => ({ key, ...v }));
  const phrases = all.filter((x) => x.key.includes(" ") && x.count >= 2);
  const singles = all.filter((x) => !x.key.includes(" "));

  // Phrases are more specific — rank them a bit higher; drop single words
  // that only ever appear inside a chosen phrase.
  const techish = (key: string) => proper.has(key) || /[+#./]/.test(key);
  const ranked = [
    ...phrases.map((p) => ({ ...p, score: p.count * 1.6 })),
    ...singles.map((s) => ({ ...s, score: s.count + (techish(s.key) ? 1.2 : 0) })),
  ].sort((a, b) => b.score - a.score || b.count - a.count || a.term.localeCompare(b.term));

  const picked: typeof ranked = [];
  for (const candidate of ranked) {
    if (picked.length >= limit) break;
    if (!candidate.key.includes(" ")) {
      const covered = picked.some(
        (p) => p.key.includes(" ") && p.key.split(" ").includes(candidate.key) && p.count >= candidate.count
      );
      if (covered) continue;
    }
    picked.push(candidate);
  }
  return picked.map(({ term, count }) => ({ term, count }));
}

export function containsTerm(haystackTokens: string[], term: string): boolean {
  const parts = tokens(term).map(stem);
  if (parts.length === 0) return false;
  for (let i = 0; i <= haystackTokens.length - parts.length; i++) {
    let ok = true;
    for (let j = 0; j < parts.length; j++) {
      if (haystackTokens[i + j] !== parts[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function analyzeJobMatch(version: ResumeVersion, jobText: string, limit = 20): KeywordReport {
  const keywords = extractKeywords(jobText, limit);
  const resumeTokens = tokens(resumeToPlainText(version)).map(stem);
  const scored = keywords.map((k) => ({ ...k, matched: containsTerm(resumeTokens, k.term) }));
  const matchedCount = scored.filter((k) => k.matched).length;
  return {
    keywords: scored,
    matchedCount,
    total: scored.length,
    score: scored.length ? Math.round((matchedCount / scored.length) * 100) : 0,
  };
}
