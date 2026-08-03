"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExportPreviewShell } from "@/components/preview/ExportPreviewShell";
import { getPrintSession, type ExportSessionOptions } from "@/lib/export";
import type { ResumeVersion } from "@/lib/schema";

type SessionState = {
  version: ResumeVersion;
  options?: ExportSessionOptions;
} | null;

export default function ExportPreviewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const autoPrint = searchParams.get("print") === "1";
  const [session, setSession] = useState<SessionState | "loading">("loading");

  useEffect(() => {
    if (!token) {
      setSession(null);
      return;
    }
    const found = getPrintSession(token);
    setSession(found);
  }, [token]);

  if (session === "loading") {
    return <p className="p-6 text-sm text-gray-500">Loading preview…</p>;
  }

  if (!token) {
    return <p className="p-6 text-sm text-gray-500">Missing export token.</p>;
  }

  if (!session) {
    return (
      <p className="p-6 text-sm text-gray-500">
        Export session expired. Close this tab and try Print or Save PDF again.
      </p>
    );
  }

  return (
    <ExportPreviewShell
      version={session.version}
      options={session.options}
      autoPrint={autoPrint}
    />
  );
}
