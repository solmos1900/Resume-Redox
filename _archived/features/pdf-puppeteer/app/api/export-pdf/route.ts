import { NextRequest, NextResponse } from "next/server";
import { resumeVersionSchema } from "@/lib/schema";
import {
  createExportSession,
  deleteExportSession,
  getExportSession,
} from "@/lib/export-cache";
import { renderResumePdf } from "@/lib/export-pdf-server";
import { getExportFilename } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const session = await getExportSession(token);
  if (!session) {
    return NextResponse.json({ error: "Export session expired" }, { status: 404 });
  }

  return NextResponse.json(session);
}

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
    const previewUrl = `${getBaseUrl(request)}/export/preview?token=${token}`;

    try {
      const pdf = await renderResumePdf(previewUrl);
      const filename = getExportFilename(parsed.data);

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    } finally {
      await deleteExportSession(token);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF export failed";
    console.error("PDF export failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
