import { NextRequest, NextResponse } from "next/server";
import { extractJobTitle } from "@/lib/job-description";
import { callOpenAI, getOpenAiKey } from "@/lib/ai/client";

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, sourceResumeName } = (await request.json()) as {
      jobDescription?: string;
      sourceResumeName?: string;
    };

    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    const fallback = extractJobTitle(jobDescription);

    if (!getOpenAiKey()) {
      return NextResponse.json({ name: fallback });
    }

    const prompt = `Suggest a short resume version name (like a ChatGPT conversation title) for someone tailoring their resume to this job. Max 60 characters. Be specific — include role and company if visible.

${sourceResumeName ? `Base resume: ${sourceResumeName}\n` : ""}
Job description:
${jobDescription.slice(0, 8000)}

Return JSON only: { "name": "..." }`;

    const content = await callOpenAI(prompt, 0.3);
    const parsed = JSON.parse(content) as { name?: string };
    return NextResponse.json({
      name: parsed.name?.trim().slice(0, 60) || fallback,
    });
  } catch {
    return NextResponse.json({ name: "Tailored Resume" });
  }
}
