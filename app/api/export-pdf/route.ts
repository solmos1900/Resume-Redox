import { NextRequest, NextResponse } from "next/server";
import { resumeVersionSchema } from "@/lib/schema";
import { getExportFilename } from "@/lib/export";
import { renderResumePdf } from "@/lib/export/render-resume-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Chromium cold start + render; Pro supports up to 60s. */
export const maxDuration = 60;

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resumeVersionSchema.safeParse(body.version);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid resume data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(request);
    const pdf = await renderResumePdf(parsed.data, baseUrl);
    const filename = getExportFilename(parsed.data);

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF export failed";
    console.error("PDF export failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
