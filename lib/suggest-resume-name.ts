import { extractJobTitle } from "./job-description";

export async function suggestResumeName(
  jobText: string,
  sourceResumeName?: string
): Promise<string> {
  const trimmed = jobText.trim();
  if (!trimmed) {
    return sourceResumeName ? `${sourceResumeName} (Copy)` : "New Resume";
  }

  try {
    const res = await fetch("/api/ai/suggest-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: trimmed, sourceResumeName }),
    });
    if (res.ok) {
      const data = (await res.json()) as { name?: string };
      if (data.name?.trim()) return data.name.trim();
    }
  } catch {
    /* fall through to local */
  }

  return extractJobTitle(trimmed);
}
