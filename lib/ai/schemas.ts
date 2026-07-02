import { z } from "zod";
import { aiRecommendationSchema } from "@/lib/schema";
import { ensureRecommendationIds } from "./parse";

export const aiResponseSchema = z.object({
  recommendations: z.array(
    aiRecommendationSchema.omit({ id: true, createdAt: true, status: true })
  ),
  summary: z.string().optional(),
  score: z.number().optional(),
});

export type AiApiResponse = z.infer<typeof aiResponseSchema>;

export function parseAiResponse(raw: unknown): AiApiResponse {
  const parsed = aiResponseSchema.parse(raw);
  return {
    ...parsed,
    recommendations: ensureRecommendationIds(parsed.recommendations),
  };
}

export const tailorResponseSchema = z.object({
  recommendations: z.array(
    aiRecommendationSchema.omit({ id: true, createdAt: true, status: true })
  ),
  suggestedName: z.string().optional(),
  summary: z.string().optional(),
  skillGroups: z
    .array(
      z.object({
        id: z.string(),
        category: z.string(),
        items: z.string(),
      })
    )
    .optional(),
  experience: z
    .array(
      z.object({
        id: z.string(),
        company: z.string(),
        location: z.string(),
        title: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        current: z.boolean(),
        bullets: z.array(z.string()),
      })
    )
    .optional(),
});

export type TailorApiResponse = z.infer<typeof tailorResponseSchema>;

export function parseTailorResponse(raw: unknown): TailorApiResponse & {
  recommendations: ReturnType<typeof ensureRecommendationIds>;
} {
  const parsed = tailorResponseSchema.parse(raw);
  return {
    ...parsed,
    recommendations: ensureRecommendationIds(parsed.recommendations),
  };
}
