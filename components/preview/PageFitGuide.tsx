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

function PageFitBanner({ result }: { result: PageFitResult }) {
  const styles = {
    fits: "border-green-200 bg-green-50 text-green-900",
    tight: "border-amber-200 bg-amber-50 text-amber-900",
    overflow: "border-red-200 bg-red-50 text-red-900",
    margin: "border-orange-200 bg-orange-50 text-orange-900",
  } as const;

  const labels = {
    fits: "One page",
    tight: "Nearly full",
    overflow: "Page 2 overflow",
    margin: "Margin warning",
  } as const;

  return (
    <div
      className={`no-print mb-3 rounded-lg border px-3 py-2 text-xs ${styles[result.status]}`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="font-semibold">{labels[result.status]}</span>
        <span className="text-[11px] opacity-80">
          US Letter · 8.5×11 in · 0.5 in top/bottom · 0.75 in sides
        </span>
      </div>
      <p className="mt-1 leading-relaxed">{formatOverflowMessage(result)}</p>
    </div>
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

export function PageFitGuide() {
  const activeVersionId = useResumeStore((s) => s.activeVersionId);
  const templateId = useResumeStore((s) => s.getActiveVersion()?.templateId);
  const [result, setResult] = useState<PageFitResult | null>(null);
  const [frameHeight, setFrameHeight] = useState(LETTER_HEIGHT_PX);
  const { containerRef, scale } = usePreviewScale();
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      const element = document.getElementById("resume-preview");
      if (!element) return;
      setResult(measurePrintPageFit(element));
      if (frameRef.current) {
        setFrameHeight(
          Math.max(LETTER_HEIGHT_PX, frameRef.current.offsetHeight)
        );
      }
    };

    measure();

    const element = document.getElementById("resume-preview");
    if (!element) return;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    if (frameRef.current) resizeObserver.observe(frameRef.current);

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeVersionId, templateId]);

  const marginX = PAGE_MARGIN_X_IN * PX_PER_IN;
  const marginTop = PAGE_MARGIN_TOP_IN * PX_PER_IN;
  const scaledHeight = frameHeight * scale;

  return (
    <div className="flex w-full flex-col items-stretch sm:items-center">
      {result && <PageFitBanner result={result} />}
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
              className="page-fit-margin-guide pointer-events-none absolute border border-dashed border-blue-300/70 rounded-sm"
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
                  className="page-fit-break-line pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-dashed border-red-500"
                  style={{ top: PRINT_CONTENT_AREA_BOTTOM_PX }}
                  aria-hidden
                />
                <div
                  className="page-fit-overflow-region pointer-events-none absolute left-0 right-0 z-10 bg-red-200/35"
                  style={{
                    top: PRINT_CONTENT_AREA_BOTTOM_PX,
                    height: result.overflowPx,
                  }}
                  aria-hidden
                />
                <div
                  className="page-fit-page-label pointer-events-none absolute z-20 rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                  style={{ top: PRINT_CONTENT_AREA_BOTTOM_PX + 8, right: 12 }}
                >
                  Page 2
                </div>
              </>
            )}
            <ResumePreview />
          </div>
        </div>
      </div>
      {scale < 0.99 && (
        <p className="no-print mt-2 mb-2 text-center text-[11px] text-gray-500">
          Preview scaled to {Math.round(scale * 100)}% — print/PDF stays full
          letter size.
        </p>
      )}
    </div>
  );
}
