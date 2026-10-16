"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import {
  formatOverflowMessage,
  LETTER_HEIGHT_PX,
  LETTER_WIDTH_PX,
  measurePrintPageFit,
  PAGE_MARGIN_X_IN,
  PAGE_MARGIN_TOP_IN,
  PRINT_CONTENT_AREA_BOTTOM_PX,
  PX_PER_IN,
  type PageFitResult,
} from "@/lib/page-fit";
import { ResumePreview } from "./ResumePreview";

export function PageFitBadge({ result }: { result: PageFitResult }) {
  const styles = {
    fits: "bg-moss-50 text-moss-700 ring-moss-100",
    tight: "bg-amber-50 text-amber-800 ring-amber-200",
    overflow: "bg-red-50 text-red-700 ring-red-200",
    margin: "bg-amber-50 text-amber-800 ring-amber-200",
  } as const;
  const labels = {
    fits: "Fits on one page",
    tight: "Nearly full",
    overflow: "Spills onto page 2",
    margin: "Check the margins",
  } as const;
  const dot = {
    fits: "bg-moss-500",
    tight: "bg-amber-500",
    overflow: "bg-red-500",
    margin: "bg-amber-500",
  } as const;

  return (
    <span
      className={`no-print inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${styles[result.status]}`}
      title={formatOverflowMessage(result)}
    >
      <span className={`h-2 w-2 rounded-full ${dot[result.status]}`} aria-hidden />
      {labels[result.status]}
      <span className="sr-only">. {formatOverflowMessage(result)}</span>
    </span>
  );
}

function usePreviewScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const available = el.clientWidth;
      const next = available > 0 ? Math.min(1, available / LETTER_WIDTH_PX) : 1;
      setScale(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("orientationchange", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return { containerRef, scale };
}

export function PageFitGuide({
  onResult,
}: {
  /** Reports the fit status so the surrounding chrome can show it. */
  onResult?: (result: PageFitResult | null) => void;
}) {
  const activeVersionId = useResumeStore((s) => s.activeVersionId);
  const templateId = useResumeStore((s) => s.getActiveVersion()?.templateId);
  const designKey = useResumeStore((s) => {
    const v = s.getActiveVersion();
    if (!v) return "";
    const d = v.design;
    return [
      v.updatedAt,
      d?.fontFamily,
      d?.fontSize,
      d?.accentColor,
      d?.spacing,
      (v.sectionOrder ?? []).join(","),
    ].join("|");
  });
  const [result, setResult] = useState<PageFitResult | null>(null);
  const [frameHeight, setFrameHeight] = useState(LETTER_HEIGHT_PX);
  const { containerRef, scale } = usePreviewScale();
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scope to this frame: thumbnails elsewhere on the page render the same
    // templates (and the same element id).
    const findDocument = () =>
      frameRef.current?.querySelector<HTMLElement>(".resume-document") ?? null;

    const measure = () => {
      const element = findDocument();
      if (!element) return;
      setResult(measurePrintPageFit(element));
      if (frameRef.current) {
        setFrameHeight(
          Math.max(LETTER_HEIGHT_PX, frameRef.current.offsetHeight)
        );
      }
    };

    measure();

    const element = findDocument();
    if (!element) return;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    if (frameRef.current) resizeObserver.observe(frameRef.current);

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeVersionId, templateId, designKey]);

  useEffect(() => {
    onResult?.(result);
  }, [result, onResult]);

  const marginX = PAGE_MARGIN_X_IN * PX_PER_IN;
  const marginTop = PAGE_MARGIN_TOP_IN * PX_PER_IN;
  const scaledHeight = frameHeight * scale;

  return (
    <div className="flex w-full flex-col items-stretch sm:items-center">
      <div ref={containerRef} className="w-full flex justify-center">
        <div
          className="relative"
          style={{
            width: LETTER_WIDTH_PX * scale,
            height: scaledHeight,
          }}
        >
          <div
            ref={frameRef}
            className="page-fit-frame absolute left-0 top-0 origin-top-left"
            style={{
              width: LETTER_WIDTH_PX,
              minHeight: LETTER_HEIGHT_PX,
              transform: `scale(${scale})`,
            }}
          >
            <div
              className="page-fit-margin-guide pointer-events-none absolute rounded-sm border border-dashed border-brand-300/40"
              style={{
                top: marginTop,
                left: marginX,
                right: marginX,
                bottom: marginTop,
              }}
              aria-hidden
            />
            {result && !result.fitsOnePage && result.overflowPx > 0 && (
              <>
                <div
                  className="page-fit-break-line pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-dashed border-red-400"
                  style={{ top: PRINT_CONTENT_AREA_BOTTOM_PX }}
                  aria-hidden
                />
                <div
                  className="page-fit-overflow-region pointer-events-none absolute left-0 right-0 z-10 bg-red-100/40"
                  style={{
                    top: PRINT_CONTENT_AREA_BOTTOM_PX,
                    height: result.overflowPx,
                  }}
                  aria-hidden
                />
                <div
                  className="page-fit-page-label pointer-events-none absolute z-20 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                  style={{ top: PRINT_CONTENT_AREA_BOTTOM_PX + 8, right: 12 }}
                >
                  Page 2 starts here
                </div>
              </>
            )}
            <ResumePreview />
          </div>
        </div>
      </div>

    </div>
  );
}
