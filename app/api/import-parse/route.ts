import { NextRequest, NextResponse } from "next/server";
import { parseResumeFile } from "@/lib/import/parse-file";
import { buildImportVersion } from "@/lib/import/build-import-version";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing file. Upload a PDF or DOCX." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File is too large (max 8 MB)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseResumeFile({
      buffer,
      fileName: file.name || "resume",
      mimeType: file.type,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 422 });
    }

    const version = buildImportVersion(result.fields, {
      name: result.suggestedName,
      fileName: result.fileName,
    });

    return NextResponse.json({
      ok: true,
      format: result.format,
      fileName: result.fileName,
      suggestedName: result.suggestedName,
      warnings: result.warnings,
      likelyImageOnly: result.likelyImageOnly,
      fields: result.fields,
      version,
      // Keep a short preview of extracted text for empty/error UX — not the full dump
      textPreview: result.text.slice(0, 500),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected import error.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
