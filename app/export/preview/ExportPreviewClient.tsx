"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExportPreviewShell } from "@/components/preview/ExportPreviewShell";
import { getPrintSession, type ExportSessionOptions } from "@/lib/export";
import { resumeVersionSchema, type ResumeVersion } from "@/lib/schema";

type SessionState = {
  version: ResumeVersion;
  options?: ExportSessionOptions;
} | null;

declare global {
  interface Window {
    __RESUME_REDOX_EXPORT__?: unknown;
  }
}

export default function ExportPreviewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const autoPrint = searchParams.get("print") === "1";
  const chromiumCapture = searchParams.get("chromium") === "1";
  const [session, setSession] = useState<SessionState | "loading">("loading");

  useEffect(() => {
    // Chromium PDF path injects the resume before navigation (no localStorage).
    if (chromiumCapture && window.__RESUME_REDOX_EXPORT__) {
      const parsed = resumeVersionSchema.safeParse(window.__RESUME_REDOX_EXPORT__);
      if (parsed.success) {
        setSession({ version: parsed.data });
        return;
      }
    }

    if (!token) {
      setSession(null);
      return;
    }
    const found = getPrintSession(token);
    setSession(found);
  }, [token, chromiumCapture]);

  if (session === "loading") {
    return <p className="p-6 text-sm text-gray-500">Loading preview…</p>;
  }

  if (!chromiumCapture && !token) {
    return <p className="p-6 text-sm text-gray-500">Missing export token.</p>;
  }

  if (!session) {
    return (
      <p className="p-6 text-sm text-gray-500">
        Export session expired. Close this tab and try Print again.
      </p>
    );
  }

  return (
    <ExportPreviewShell
      version={session.version}
      options={session.options}
      autoPrint={autoPrint && !chromiumCapture}
    />
  );
}
