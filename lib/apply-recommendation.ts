import type { AiRecommendation, ResumeVersion } from "@/lib/schema";

function setNestedField(
  obj: Record<string, unknown>,
  path: string,
  value: string
): boolean {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = current[key];
    if (next === undefined || next === null) return false;
    if (Array.isArray(next)) {
      const idx = parseInt(parts[i + 1], 10);
      if (Number.isNaN(idx) || !next[idx]) return false;
      if (i + 1 === parts.length - 1) {
        (next as string[])[idx] = value;
        return true;
      }
      current = next[idx] as Record<string, unknown>;
      i++;
      continue;
    }
    current = next as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = value;
  return true;
}

export function applyRecommendationToVersion(
  version: ResumeVersion,
  rec: AiRecommendation
): ResumeVersion | null {
  if (!rec.suggestedText) return null;

  const updated = JSON.parse(JSON.stringify(version)) as ResumeVersion;

  if (rec.section === "contact" && rec.fieldPath) {
    const contact = updated.contact as unknown as Record<string, unknown>;
    if (rec.fieldPath in contact) {
      contact[rec.fieldPath] = rec.suggestedText;
      return updated;
    }
  }

  if (rec.section === "summary" && (!rec.fieldPath || rec.fieldPath === "summary")) {
    updated.summary = rec.suggestedText;
    return updated;
  }

  if (rec.section === "experience" && rec.targetId && rec.fieldPath) {
    const exp = updated.experience.find((e) => e.id === rec.targetId);
    if (!exp) return null;
    const expObj = exp as unknown as Record<string, unknown>;
    if (rec.fieldPath.startsWith("bullets.")) {
      const idx = parseInt(rec.fieldPath.split(".")[1], 10);
      if (!Number.isNaN(idx) && exp.bullets[idx] !== undefined) {
        exp.bullets[idx] = rec.suggestedText;
        return updated;
      }
    }
    if (setNestedField(expObj, rec.fieldPath, rec.suggestedText)) return updated;
  }

  if (rec.section === "skills" && rec.targetId && rec.fieldPath) {
    const group = updated.skillGroups.find((g) => g.id === rec.targetId);
    if (!group) return null;
    if (rec.fieldPath === "items" || rec.fieldPath === "category") {
      group[rec.fieldPath as "items" | "category"] = rec.suggestedText;
      return updated;
    }
  }

  if (rec.section === "education" && rec.targetId && rec.fieldPath) {
    const edu = updated.education.find((e) => e.id === rec.targetId);
    if (!edu) return null;
    if (["institution", "location", "details"].includes(rec.fieldPath)) {
      edu[rec.fieldPath as "institution" | "location" | "details"] =
        rec.suggestedText;
      return updated;
    }
  }

  return null;
}

export function applyAllSpellFixes(version: ResumeVersion): ResumeVersion {
  let updated = JSON.parse(JSON.stringify(version)) as ResumeVersion;

  for (const rec of version.aiRecommendations) {
    if (rec.type !== "spell" || rec.status !== "open" || !rec.suggestedText) {
      continue;
    }
    const result = applyRecommendationToVersion(updated, rec);
    if (result) updated = result;
  }

  updated.aiRecommendations = updated.aiRecommendations.map((r) =>
    r.type === "spell" && r.status === "open" && r.suggestedText
      ? { ...r, status: "applied" as const }
      : r
  );

  return updated;
}
