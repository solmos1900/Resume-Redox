import { NextRequest, NextResponse } from "next/server";
import {
  extractJobTitle,
  extractKeywords,
  tailorSkillsForJob,
} from "@/lib/job-description";
import { aiUnavailableResponse, callOpenAI, getOpenAiKey } from "@/lib/ai/client";
import { tailorPrompt } from "@/lib/ai/prompts";
import { parseTailorResponse } from "@/lib/ai/schemas";
import { ensureRecommendationIds } from "@/lib/ai/parse";
import type { ResumeVersion } from "@/lib/schema";

type TailorRequest = {
  resume: ResumeVersion;
  jobDescription: string;
  mode: "create" | "adjust";
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TailorRequest;
    const { resume, jobDescription, mode } = body;

    if (!resume || !jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    if (!getOpenAiKey()) {
      const keywords = extractKeywords(jobDescription);
      return NextResponse.json({
        suggestedName: extractJobTitle(jobDescription),
        skillGroups: tailorSkillsForJob(resume.skillGroups, keywords),
        keywords,
        recommendations: ensureRecommendationIds([
          {
            type: "tailor",
            section: "overall",
            severity: "suggestion",
            title: "Local tailoring applied",
            message: `Skills reordered by job keywords. Add OPENAI_API_KEY for full AI tailoring.`,
          },
        ]),
        aiAvailable: false,
      });
    }

    const content = await callOpenAI(
      tailorPrompt(resume, jobDescription, mode),
      0.4
    );
    const result = parseTailorResponse(JSON.parse(content));
    return NextResponse.json({
      ...result,
      keywords: extractKeywords(jobDescription),
      aiAvailable: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tailor failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
