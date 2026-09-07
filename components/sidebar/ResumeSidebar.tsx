"use client";

import { useEffect, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";
import { BackupImportMenu } from "./BackupImportMenu";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  /** Full-width list for the mobile Resumes tab. */
  variant?: "desktop" | "mobile";
  /** Called after selecting a resume (e.g. switch mobile tab to Edit). */
  onSelectResume?: () => void;
};

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ResumeSidebar({
  collapsed,
  onToggle,
  variant = "desktop",
  onSelectResume,
}: Props) {
  const versions = useResumeStore((s) => s.versions);
  const activeVersionId = useResumeStore((s) => s.activeVersionId);
  const setActiveVersion = useResumeStore((s) => s.setActiveVersion);
  const renameVersion = useResumeStore((s) => s.renameVersion);
  const deleteVersion = useResumeStore((s) => s.deleteVersion);
  const openNewResumeDialog = useUiStore((s) => s.openNewResumeDialog);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const isMobile = variant === "mobile";
  const showList = isMobile || !collapsed;

  const sorted = [...versions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const submitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameVersion(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const selectVersion = (id: string) => {
    setActiveVersion(id);
    onSelectResume?.();
  };

  return (
    <>
      <aside
        className={`no-print flex flex-col bg-gray-900 text-gray-100 transition-all duration-200 ${
          isMobile
            ? "h-full w-full"
            : `shrink-0 ${collapsed ? "w-14" : "w-64"}`
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          {showList && (
            <span className="text-sm font-semibold tracking-wide">Resumes</span>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-300 min-w-[36px] min-h-[36px]"
            title={
              isMobile
                ? "Back to editor"
                : collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
          >
            {isMobile ? "←" : collapsed ? "→" : "←"}
          </button>
        </div>

        {showList && (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain py-2">
              {sorted.map((version) => {
                const isActive = version.id === activeVersionId;
                const hasJob = version.jobDescription?.text?.trim();

                return (
                  <div
                    key={version.id}
                    className={`group mx-2 mb-1 rounded-lg ${
                      isActive ? "bg-gray-700" : "hover:bg-gray-800"
                    }`}
                  >
                    {renamingId === version.id ? (
                      <div className="p-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onBlur={submitRename}
                          className="w-full text-sm text-gray-900 rounded px-2 py-2"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => selectVersion(version.id)}
                        className="w-full text-left px-3 py-3"
                      >
                        <div className="text-sm font-medium truncate">
                          {version.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                          <span>{formatRelativeDate(version.updatedAt)}</span>
                          {hasJob && (
                            <span className="text-blue-400">• Role</span>
                          )}
                        </div>
                      </button>
                    )}

                    {renamingId !== version.id && (
                      <div
                        className={`flex-wrap px-2 pb-2 gap-1 ${
                          isMobile
                            ? "flex"
                            : "hidden group-hover:flex"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => startRename(version.id, version.name)}
                          className="text-xs px-2.5 py-1.5 rounded bg-gray-600 hover:bg-gray-500"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (versions.length <= 1) return;
                            if (confirm(`Delete "${version.name}"?`)) {
                              deleteVersion(version.id);
                            }
                          }}
                          disabled={versions.length <= 1}
                          className="text-xs px-2.5 py-1.5 rounded bg-red-900/60 hover:bg-red-800 disabled:opacity-30"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-700 flex items-center gap-2 safe-area-bottom">
              <button
                type="button"
                onClick={() => openNewResumeDialog("create")}
                className="flex-1 text-sm py-2.5 px-3 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors"
              >
                + New resume
              </button>
              <BackupImportMenu />
            </div>
          </>
        )}

        {!isMobile && collapsed && (
          <div className="flex flex-col items-center py-3 gap-2">
            <button
              type="button"
              onClick={() => openNewResumeDialog("create")}
              className="p-2 rounded hover:bg-gray-800 text-lg"
              title="New resume"
            >
              +
            </button>
            <BackupImportMenu collapsed />
          </div>
        )}
      </aside>
    </>
  );
}

export function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("resume-redox-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("resume-redox-sidebar-collapsed", String(next));
      return next;
    });
  };

  return [collapsed, toggle];
}
