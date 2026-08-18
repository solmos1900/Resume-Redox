export const PX_PER_IN = 96;

export const LETTER_WIDTH_IN = 8.5;
export const LETTER_HEIGHT_IN = 11;
export const PAGE_MARGIN_TOP_IN = 0.5;
export const PAGE_MARGIN_BOTTOM_IN = 0.5;
export const PAGE_MARGIN_X_IN = 0.75;

/** Extra slack vs Chrome print rounding. */
export const PRINT_SAFETY_BUFFER_IN = 0.1;

export const LETTER_WIDTH_PX = LETTER_WIDTH_IN * PX_PER_IN;
export const LETTER_HEIGHT_PX = LETTER_HEIGHT_IN * PX_PER_IN;
export const CONTENT_WIDTH_PX =
  (LETTER_WIDTH_IN - PAGE_MARGIN_X_IN * 2) * PX_PER_IN;

/** Bottom of the first-page content box (11in minus bottom padding). */
export const PRINT_CONTENT_AREA_BOTTOM_PX =
  LETTER_HEIGHT_PX - PAGE_MARGIN_BOTTOM_IN * PX_PER_IN;

export const PRINT_PAGE_LIMIT_PX =
  LETTER_HEIGHT_PX - PRINT_SAFETY_BUFFER_IN * PX_PER_IN;

export type PageFitStatus = "fits" | "tight" | "overflow" | "margin";

export type PageFitResult = {
  status: PageFitStatus;
  fitsOnePage: boolean;
  heightPx: number;
  widthPx: number;
  overflowPx: number;
  overflowIn: number;
  utilizationPercent: number;
  marginOverflowPx: number;
};

export function measurePageFit(
  heightPx: number,
  scrollWidthPx: number,
  clientWidthPx: number,
  contentLimitPx: number = PRINT_PAGE_LIMIT_PX
): PageFitResult {
  const overflowPx = Math.max(0, heightPx - contentLimitPx);
  const overflowIn = overflowPx / PX_PER_IN;
  const utilizationPercent = (heightPx / LETTER_HEIGHT_PX) * 100;
  const marginOverflowPx = Math.max(0, scrollWidthPx - clientWidthPx);

  let status: PageFitStatus = "fits";
  if (marginOverflowPx > 1) {
    status = "margin";
  } else if (overflowPx > 0) {
    status = "overflow";
  } else if (utilizationPercent >= 92) {
    status = "tight";
  }

  return {
    status,
    fitsOnePage: overflowPx <= 0 && marginOverflowPx <= 1,
    heightPx,
    widthPx: scrollWidthPx,
    overflowPx,
    overflowIn,
    utilizationPercent,
    marginOverflowPx,
  };
}

/**
 * Measure page fit using the same 8.5×11in box and 0.5in / 0.75in padding
 * as on-screen preview and Save as PDF.
 */
export function measurePrintPageFit(element: HTMLElement): PageFitResult {
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;";

  const clone = element.cloneNode(true) as HTMLElement;
  clone.classList.add("page-fit-print-measure");
  clone.removeAttribute("id");
  container.appendChild(clone);
  document.body.appendChild(container);

  const result = measurePageFit(
    clone.scrollHeight,
    clone.scrollWidth,
    clone.clientWidth,
    PRINT_PAGE_LIMIT_PX
  );

  document.body.removeChild(container);
  return result;
}

export function formatOverflowMessage(result: PageFitResult): string {
  if (result.status === "margin") {
    return "Content may exceed side margins — check for long lines or wide elements.";
  }
  if (result.status === "overflow") {
    const lines = Math.max(1, Math.round(result.overflowIn * 6));
    return `Overflows by ${result.overflowIn.toFixed(2)} in (~${lines} line${lines === 1 ? "" : "s"}) — will spill to page 2 when printing or saving PDF.`;
  }
  if (result.status === "tight") {
    return `Nearly full (${Math.round(result.utilizationPercent)}% of page) — small edits may push content to page 2.`;
  }
  return `Fits on 1 page (${Math.round(result.utilizationPercent)}% used).`;
}
