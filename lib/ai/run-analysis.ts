import type { AiRecommendation, ResumeVersion } from "@/lib/schema";

export type AiAnalysisResult = {
  recommendations: AiRecommendation[];
  summary?: string;
  score?: number;
};

async function postAi<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export function runRoast(resume: ResumeVersion) {
  return postAi<AiAnalysisResult>("/api/ai/roast", { resume });
}

export function runSpellCheck(resume: ResumeVersion) {
  return postAi<AiAnalysisResult>("/api/ai/spell-check", { resume });
}

export function runRecommend(resume: ResumeVersion) {
  return postAi<AiAnalysisResult>("/api/ai/recommend", { resume });
}
