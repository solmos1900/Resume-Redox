"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import { saveResumeAsPdf, printResume } from "@/lib/export";

export function VersionToolbar() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = async () => {
    if (!version) return;
    setSaving(true);
    setStatus(null);
    try {
      await saveResumeAsPdf(version);
      setStatus("PDF saved.");
    } catch {
      setStatus("Save failed. Try Print instead.");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handlePrint = () => {
    if (!version) return;
    printResume(version);
  };

  return (
    <header className="no-print flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Resume Redox</h1>
        {version && (
          <p className="text-xs text-gray-500 mt-0.5">
            Editing: {version.name}
            {version.contact.fullName.trim() &&
              ` · ${version.contact.fullName}`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {status && (
          <span className="text-xs text-gray-500 mr-2">{status}</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !version}
          className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 font-medium"
        >
          {saving ? "Saving..." : "Save PDF"}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          disabled={!version}
          className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 font-medium"
        >
          Print
        </button>
      </div>
    </header>
  );
}
