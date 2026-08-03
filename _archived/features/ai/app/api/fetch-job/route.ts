import { NextRequest, NextResponse } from "next/server";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url?.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const response = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ResumeRedox/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch (${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const text = stripHtml(html).slice(0, 20000);

    if (text.length < 100) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from this page. Try pasting the job description directly.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch job posting. Paste the description as text instead." },
      { status: 500 }
    );
  }
}
