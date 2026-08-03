import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { storeSchema } from "@/lib/schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "resumes.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = storeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid resume store file" },
        { status: 500 }
      );
    }
    return NextResponse.json(parsed.data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json(null);
    }
    return NextResponse.json(
      { error: "Failed to read resume store" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = storeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid resume store data" },
        { status: 400 }
      );
    }

    await ensureDataDir();
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(parsed.data, null, 2),
      "utf-8"
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save resume store" },
      { status: 500 }
    );
  }
}
