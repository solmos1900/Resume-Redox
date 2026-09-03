"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `lg` (1024px). SSR defaults to desktop to avoid flash of mobile chrome. */
export function useIsDesktop(breakpointPx = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);

  return isDesktop;
}
