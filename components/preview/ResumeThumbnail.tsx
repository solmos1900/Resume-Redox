"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { ResumeVersion, TemplateId } from "@/lib/schema";
import { toResumeContent } from "@/lib/templates/types";
import { LETTER_HEIGHT_PX, LETTER_WIDTH_PX } from "@/lib/page-fit";
import { TemplateRenderer } from "./templates/TemplateRenderer";

type Props = {
  version: ResumeVersion;
  /** Render with a different template than the version's own. */
  templateId?: TemplateId;
  className?: string;
};

/**
 * A real, scaled-down render of a resume — the same template components the
 * preview and PDF use, so thumbnails never lie about the result.
 */
function ResumeThumbnailImpl({ version, templateId, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / LETTER_WIDTH_PX);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = toResumeContent(version);

  return (
    <div
      ref={ref}
      className={`resume-thumb relative w-full overflow-hidden bg-white ${className}`}
      style={{ aspectRatio: `${LETTER_WIDTH_PX} / ${LETTER_HEIGHT_PX}` }}
      aria-hidden
      inert
    >
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: LETTER_WIDTH_PX, transform: `scale(${scale})` }}
        >
          <TemplateRenderer templateId={templateId ?? version.templateId} data={data} />
        </div>
      )}
    </div>
  );
}

export const ResumeThumbnail = memo(ResumeThumbnailImpl);
