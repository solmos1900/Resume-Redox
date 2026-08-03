import { NextRequest, NextResponse } from "next/server";
import { resumeVersionSchema } from "@/lib/schema";
import { createExportSession } from "@/lib/export-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resumeVersionSchema.safeParse(body.version);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid resume data" }, { status: 400 });
    }

    const includeTimestampOnResume = body.includeTimestampOnResume === true;

    const token = await createExportSession(parsed.data, {
      exportedAt: new Date().toISOString(),
      includeTimestampOnResume,
    });

    return NextResponse.json({ token });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create export session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
