"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrowRight } from "@/components/ui/icons";

/** Primary CTA that greets returning users with "Continue" instead of "Start". */
export function LandingCta({
  className = "btn btn-brand btn-lg",
  freshLabel = "Build my resume — free",
}: {
  className?: string;
  freshLabel?: string;
}) {
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("resume-redox-ui");
      setReturning(Boolean(raw && JSON.parse(raw)?.state?.hasEnteredEditor));
    } catch {
      setReturning(false);
    }
  }, []);

  return (
    <Link href="/app" className={className}>
      {returning ? "Continue to my resumes" : freshLabel}
      <IconArrowRight size={18} />
    </Link>
  );
}
