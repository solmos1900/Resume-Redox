import type { AiRecommendation, AiRecommendationType } from "@/lib/schema";

export function ensureRecommendationIds(
  items: Omit<AiRecommendation, "id" | "createdAt" | "status">[]
): AiRecommendation[] {
  const now = new Date().toISOString();
  return items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    createdAt: now,
    status: "open" as const,
  }));
}

export function mergeRecommendationsByType(
  existing: AiRecommendation[],
  type: AiRecommendationType,
  incoming: AiRecommendation[]
): AiRecommendation[] {
  const kept = existing.filter((r) => r.type !== type);
  return [...kept, ...incoming];
}
