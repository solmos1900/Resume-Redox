import { NextRequest, NextResponse } from "next/server";
import { aiUnavailableResponse, callOpenAI, getOpenAiKey } from "@/lib/ai/client";
import { roastPrompt } from "@/lib/ai/prompts";
import { parseAiResponse } from "@/lib/ai/schemas";
import type { ResumeVersion } from "@/lib/schema";

export async function POST(request: NextRequest) {
  if (!getOpenAiKey()) return aiUnavailableResponse();

  try {
    const { resume } = (await request.json()) as { resume?: ResumeVersion };
    if (!resume) {
      return NextResponse.json({ error: "Resume is required" }, { status: 400 });
    }

    const content = await callOpenAI(roastPrompt(resume), 0.5);
    const result = parseAiResponse(JSON.parse(content));
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Roast failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
