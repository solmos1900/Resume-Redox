"use client";

import { useRef, useState, type DragEvent } from "react";
import { useResumeStore } from "@/lib/store";
import { useUiStore } from "@/lib/ui-store";
import { useToastStore } from "@/lib/toast-store";
import { SEED_VERSION_ID } from "@/lib/seed-data";
import { resumeDisplayName } from "@/lib/utils";
import { getTemplateById } from "@/lib/templates/catalog";
import type { ResumeVersion } from "@/lib/schema";
import { downloadResumeBackup, importStoreFromFile } from "@/lib/file-persistence";
import { ResumeThumbnail } from "@/components/preview/ResumeThumbnail";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { Logo } from "@/components/ui/Logo";
import { Menu, MenuDivider, MenuItem } from "@/components/ui/Menu";
import { Modal } from "@/components/ui/Modal";
import {
  IconArchive,
  IconArrowRight,
  IconCopy,
  IconDots,
  IconDownload,
  IconEye,
  IconLayout,
  IconPencil,
  IconPlus,
  IconTarget,
  IconTrash,
  IconUpload,
} from "@/components/ui/icons";

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ACCEPTED_IMPORT = /\.(pdf|docx)$/i;

export function HomeDashboard() {
  const versions = useResumeStore((s) => s.versions);
  const setActiveVersion = useResumeStore((s) => s.setActiveVersion);
  const duplicateById = useResumeStore((s) => s.duplicateById);
  const renameVersion = useResumeStore((s) => s.renameVersion);
  const deleteVersion = useResumeStore((s) => s.deleteVersion);
  const importVersions = useResumeStore((s) => s.importVersions);
  const openEditor = useUiStore((s) => s.openEditor);
  const openGallery = useUiStore((s) => s.openGallery);
  const openImport = useUiStore((s) => s.openImportResumeDialog);
  const showToast = useToastStore((s) => s.showToast);

  const [renaming, setRenaming] = useState<ResumeVersion | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<ResumeVersion | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...versions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const isFirstRun = !versions.some((v) => v.id !== SEED_VERSION_ID);

  const open = (id: string) => {
    setActiveVersion(id);
    openEditor({ tab: "content" });
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (ACCEPTED_IMPORT.test(file.name)) {
      openImport(file, "new");
    } else {
      showToast("Drop a PDF or Word (.docx) resume to import it.");
    }
  };

  const restoreBackup = async (file: File) => {
    const imported = await importStoreFromFile(file);
    if (!imported?.length) {
      showToast("That file isn't a Resume Redox backup (.json).");
      return;
    }
    const n = importVersions(imported);
    useUiStore.getState().openHome();
    showToast(n === 1 ? "Restored 1 resume." : `Restored ${n} resumes.`);
  };

  return (
    <div
      className="app-chrome flex h-dvh flex-col overflow-hidden bg-paper"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={onDrop}
    >
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <Logo href="/" />
        <div className="flex items-center gap-1 sm:gap-2">
          <AccountMenu />
          <Menu
            width="w-72"
            trigger={(props) => (
              <button type="button" {...props} className="btn-icon" aria-label="Backup and restore">
                <IconArchive />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem
                  icon={<IconDownload />}
                  label="Back up all resumes"
                  hint="One .json file you can restore on any browser."
                  onClick={() => {
                    close();
                    const { activeVersionId } = useResumeStore.getState();
                    const blob = new Blob(
                      [JSON.stringify({ activeVersionId, versions }, null, 2)],
                      { type: "application/json" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `resume-redox-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                />
                <MenuItem
                  icon={<IconUpload />}
                  label="Restore from backup"
                  hint="Adds the resumes in the file — nothing is overwritten."
                  onClick={() => {
                    close();
                    backupInputRef.current?.click();
                  }}
                />
              </>
            )}
          </Menu>
          <input
            ref={backupInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void restoreBackup(file);
            }}
          />
          <button type="button" onClick={openGallery} className="btn btn-primary hidden sm:inline-flex">
            <IconPlus size={16} /> New resume
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-8 sm:pb-16">
          {isFirstRun ? (
            <section className="animate-fade-up pb-10 pt-6 sm:pt-12">
              <p className="eyebrow">Free · No watermark · No account needed</p>
              <h1 className="mt-3 max-w-2xl font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[56px]">
                Let&apos;s build the resume that gets you the interview.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
                Pick how you&apos;d like to start. Everything saves automatically
                in this browser.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
                <StartCard
                  primary
                  icon={<IconUpload size={22} />}
                  title="Import my resume"
                  body="Upload a PDF or Word file. We pull in your details so you can polish instead of retype."
                  cta="Upload file"
                  onClick={() => openImport(null, "new")}
                />
                <StartCard
                  icon={<IconLayout size={22} />}
                  title="Start from scratch"
                  body="Choose a template and fill in the blanks with live preview as you type."
                  cta="Choose a template"
                  onClick={openGallery}
                />
                <StartCard
                  icon={<IconEye size={22} />}
                  title="Explore the sample"
                  body="Poke around a finished resume to see how editing, design, and downloads work."
                  cta="Open sample"
                  onClick={() => open(SEED_VERSION_ID)}
                />
              </div>
            </section>
          ) : (
            <section className="animate-fade-up flex flex-wrap items-end justify-between gap-4 pb-6 pt-6 sm:pt-10">
              <div>
                <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[44px]">
                  My resumes
                </h1>
                <p className="mt-1 text-sm text-ink-muted">
                  Keep one per role. Unlimited, always free.
                </p>
              </div>
              <button type="button" onClick={() => openImport(null, "new")} className="btn btn-secondary">
                <IconUpload size={16} /> Import PDF / Word
              </button>
            </section>
          )}

          {isFirstRun && (
            <h2 className="mb-4 text-sm font-semibold text-ink-soft">Your resumes</h2>
          )}

          <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            <li>
              <button
                type="button"
                onClick={openGallery}
                className="group flex w-full flex-col text-left focus-visible:outline-none"
              >
                <span
                  className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-white/40 text-ink-muted transition group-hover:border-brand-400 group-hover:bg-brand-50/50 group-hover:text-brand-600 group-focus-visible:ring-2 group-focus-visible:ring-brand-500"
                  style={{ aspectRatio: "8.5 / 11" }}
                >
                  <span className="flex flex-col items-center gap-2">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
                      <IconPlus size={22} />
                    </span>
                    <span className="text-sm font-medium">New resume</span>
                  </span>
                </span>
                <span className="mt-3 block text-sm font-semibold text-ink">Blank or template</span>
                <span className="block text-xs text-ink-muted">Start a new version</span>
              </button>
            </li>

            {sorted.map((version) => (
              <li key={version.id} className="group relative focus-within:z-20 hover:z-10">
                <button
                  type="button"
                  onClick={() => open(version.id)}
                  className="block w-full text-left focus-visible:outline-none"
                  aria-label={`Open ${resumeDisplayName(version)}`}
                >
                  <span className="block overflow-hidden rounded-xl border border-line bg-white shadow-card transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lift group-focus-within:ring-2 group-focus-within:ring-brand-500">
                    <ResumeThumbnail version={version} />
                  </span>
                </button>
                <div className="mt-3 flex items-start gap-1">
                  <button
                    type="button"
                    onClick={() => open(version.id)}
                    className="min-w-0 flex-1 text-left"
                    tabIndex={-1}
                  >
                    <span className="block truncate text-sm font-semibold text-ink">
                      {resumeDisplayName(version)}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {getTemplateById(version.templateId).name} · {formatRelativeDate(version.updatedAt)}
                    </span>
                  </button>
                  <Menu
                    width="w-60"
                    trigger={(props) => (
                      <button
                        type="button"
                        {...props}
                        className="btn-icon -mr-2 -mt-1.5 h-9 w-9"
                        aria-label={`More actions for ${resumeDisplayName(version)}`}
                      >
                        <IconDots />
                      </button>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem
                          icon={<IconPencil />}
                          label="Rename"
                          onClick={() => {
                            close();
                            setRenameValue(resumeDisplayName(version));
                            setRenaming(version);
                          }}
                        />
                        <MenuItem
                          icon={<IconCopy />}
                          label="Duplicate"
                          onClick={() => {
                            close();
                            duplicateById(version.id);
                            openEditor({ tab: "content" });
                            showToast("Copy created — you're editing the copy.");
                          }}
                        />
                        <MenuItem
                          icon={<IconTarget />}
                          label="Tailor a copy for a job"
                          hint="Copy it, paste the posting, see missing keywords."
                          onClick={() => {
                            close();
                            duplicateById(version.id, `${resumeDisplayName(version)} — tailored`);
                            openEditor({ tab: "job" });
                          }}
                        />
                        <MenuItem
                          icon={<IconArchive />}
                          label="Download backup (.json)"
                          onClick={() => {
                            close();
                            downloadResumeBackup(version);
                          }}
                        />
                        <MenuDivider />
                        <MenuItem
                          icon={<IconTrash />}
                          danger
                          label="Delete"
                          disabled={versions.length <= 1}
                          hint={versions.length <= 1 ? "You need at least one resume." : undefined}
                          onClick={() => {
                            close();
                            setDeleting(version);
                          }}
                        />
                      </>
                    )}
                  </Menu>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-14 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-moss-500" aria-hidden />
            Saved privately in this browser. Drop a PDF or Word file anywhere on
            this page to import it.
          </p>
        </div>
      </main>

      {/* Phone: thumb-reachable primary action */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:hidden">
        <button type="button" onClick={openGallery} className="btn btn-primary btn-lg pointer-events-auto shadow-lift">
          <IconPlus size={18} /> New resume
        </button>
      </div>

      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-brand-500/10 backdrop-blur-[1px]">
          <div className="rounded-2xl border-2 border-dashed border-brand-500 bg-white px-8 py-6 text-center shadow-pop">
            <IconUpload className="mx-auto text-brand-500" size={28} />
            <p className="mt-2 font-display text-lg font-semibold">Drop to import</p>
            <p className="text-sm text-ink-muted">PDF or Word (.docx)</p>
          </div>
        </div>
      )}

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        size="sm"
        title="Rename resume"
        description="Tip: name it after the role, like “Product Manager — Stripe”. It's also your download's file name."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setRenaming(null)}>
              Cancel
            </button>
            <button
              type="submit"
              form="rename-form"
              className="btn btn-primary"
              disabled={!renameValue.trim()}
            >
              Save
            </button>
          </>
        }
      >
        <form
          id="rename-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (renaming && renameValue.trim()) renameVersion(renaming.id, renameValue.trim());
            setRenaming(null);
          }}
        >
          <label className="block">
            <span className="field-label">Name</span>
            <input
              data-autofocus
              className="field"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        size="sm"
        title={`Delete “${deleting ? resumeDisplayName(deleting) : ""}”?`}
        description="This removes it from this browser (and your account, if you're signed in). This can't be undone."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleting(null)} data-autofocus>
              Keep it
            </button>
            <button
              type="button"
              className="btn bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (deleting) deleteVersion(deleting.id);
                setDeleting(null);
              }}
            >
              Delete
            </button>
          </>
        }
      />
    </div>
  );
}

function StartCard({
  icon,
  title,
  body,
  cta,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:p-6 ${
        primary
          ? "border-ink bg-ink text-paper shadow-lift"
          : "border-line bg-white text-ink shadow-card"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          primary ? "bg-brand-500 text-white" : "bg-paper text-ink"
        }`}
      >
        {icon}
      </span>
      <span className="mt-4 font-display text-xl font-semibold tracking-tight">{title}</span>
      <span className={`mt-1.5 text-sm leading-relaxed ${primary ? "text-paper/70" : "text-ink-muted"}`}>
        {body}
      </span>
      <span
        className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${
          primary ? "text-brand-300" : "text-ink"
        }`}
      >
        {cta}
        <IconArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
