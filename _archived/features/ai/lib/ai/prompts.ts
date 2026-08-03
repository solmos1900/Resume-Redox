import type { ResumeVersion } from "@/lib/schema";

const RESUME_CONTEXT = (resume: ResumeVersion) =>
  JSON.stringify(resume, null, 2);

const RECOMMENDATION_SHAPE = `{
  "recommendations": [
    {
      "type": "<roast|spell|tailor|general>",
      "section": "<contact|summary|experience|skills|education|overall>",
      "targetId": "<optional id from resume JSON>",
      "fieldPath": "<optional e.g. bullets.2, fullName, items>",
      "severity": "<critical|warning|suggestion|praise>",
      "title": "short title",
      "message": "detailed feedback",
      "originalText": "<optional current text>",
      "suggestedText": "<optional fix, only when a concrete rewrite is safe>"
    }
  ],
  "summary": "<optional overall narrative>",
  "score": <optional number 1-10 for roast only>
}`;

export function roastPrompt(resume: ResumeVersion): string {
  return `You are a brutally honest resume critic. Roast this resume — identify weak bullets, vague language, missing metrics, buzzwords, ATS risks, and generic phrasing. Be direct but constructive.

Return JSON only:
${RECOMMENDATION_SHAPE}

Rules:
- All recommendations must have type "roast"
- Use severity "critical" or "warning" primarily
- Include targetId and fieldPath when pointing at specific fields
- Do not invent experience; critique what's written
- Include an overall score 1-10 in "score"

Resume:
${RESUME_CONTEXT(resume)}`;
}

export function spellCheckPrompt(resume: ResumeVersion): string {
  return `You are a proofreader. Find spelling and grammar errors in this resume. Only flag clear mistakes — do not rewrite for style or content.

Return JSON only:
${RECOMMENDATION_SHAPE}

Rules:
- All recommendations must have type "spell"
- severity should be "warning" for errors
- originalText must be the exact erroneous text
- suggestedText must be the minimal correction
- Include targetId and fieldPath for every issue

Resume:
${RESUME_CONTEXT(resume)}`;
}

export function recommendPrompt(resume: ResumeVersion): string {
  const jd = resume.jobDescription?.text?.trim();
  return `You are an expert resume coach. Give prioritized, actionable recommendations to improve this resume${jd ? " for the attached job description" : ""}.

Return JSON only:
${RECOMMENDATION_SHAPE}

Rules:
- All recommendations must have type "general"
- Use severity "suggestion" or "praise"
- Be specific — reference sections and suggest concrete changes
- Do not invent employers or metrics
${jd ? `\nJob Description:\n${jd.slice(0, 12000)}` : ""}

Resume:
${RESUME_CONTEXT(resume)}`;
}

export function tailorPrompt(
  resume: ResumeVersion,
  jobDescription: string,
  mode: "create" | "adjust"
): string {
  return `You are a resume tailoring assistant. Adjust this resume to better match the job description while keeping all claims truthful and based on existing experience.

Mode: ${mode === "create" ? "Create a new tailored version" : "Adjust the current version"}

Return JSON only:
{
  "recommendations": [
    {
      "type": "tailor",
      "section": "<contact|summary|experience|skills|education|overall>",
      "targetId": "<optional>",
      "fieldPath": "<optional>",
      "severity": "<suggestion|warning>",
      "title": "gap or change title",
      "message": "what changed and why relative to the JD"
    }
  ],
  "suggestedName": "short role-based resume name",
  "summary": "rewritten summary paragraph",
  "skillGroups": [{ "id": "keep same ids", "category": "...", "items": "comma-separated, job-relevant first" }],
  "experience": [{ "id": "keep same ids", "company": "...", "location": "...", "title": "...", "startDate": "...", "endDate": "...", "current": boolean, "bullets": ["reframed bullets"] }]
}

Rules:
- Keep all ids unchanged in skillGroups and experience
- Do not invent employers, degrees, or metrics
- Reframe existing bullets for the target role
- Recommendations should explain JD gaps and changes made

Resume:
${RESUME_CONTEXT(resume)}

Job Description:
${jobDescription.slice(0, 12000)}`;
}
