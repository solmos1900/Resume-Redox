"use client";

import { useMemo } from "react";
import { createSeedVersion } from "@/lib/seed-data";
import { ResumeThumbnail } from "@/components/preview/ResumeThumbnail";
import type { TemplateId } from "@/lib/schema";

export function HeroResume({ templateId = "accent" }: { templateId?: TemplateId }) {
  const sample = useMemo(() => createSeedVersion(), []);
  return <ResumeThumbnail version={sample} templateId={templateId} />;
}
