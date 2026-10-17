"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import {
  IconArrowLeft,
  IconChevronDown,
  IconPlus,
  IconTrash,
  IconX,
} from "@/components/ui/icons";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  disabled,
  className = "",
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        autoComplete={autoComplete ?? "off"}
        className="field disabled:bg-paper disabled:text-ink-faint"
      />
      {hint && <span className="mt-1 block text-[12px] text-ink-faint">{hint}</span>}
    </label>
  );
}

/** Textarea that grows with its content. */
export function AutoTextarea({
  value,
  minRows = 2,
  className = "",
  textareaRef,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
  minRows?: number;
  textareaRef?: (el: HTMLTextAreaElement | null) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        textareaRef?.(el);
      }}
      value={value}
      rows={minRows}
      className={`field resize-none leading-relaxed ${className}`}
      {...rest}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-soft">
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-ink" : "bg-line-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
      <input
        type="checkbox"
        role="switch"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

/** Dashed "+ Add …" button used at the bottom of every list. */
export function AddRowButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong py-3 text-sm font-medium text-ink-muted transition hover:border-ink-faint hover:bg-white hover:text-ink"
    >
      <IconPlus size={16} />
      {children}
    </button>
  );
}

/**
 * One repeatable item (a job, a degree, a project). Collapsed it shows a
 * one-line summary; expanded it shows fields plus move / remove.
 */
export function EntryCard({
  title,
  subtitle,
  placeholderTitle,
  index,
  count,
  onMove,
  onRemove,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  placeholderTitle: string;
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? !title.trim());
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <div
      className={`rounded-xl border bg-white transition ${
        open ? "border-line-strong shadow-card" : "border-line hover:border-line-strong"
      }`}
    >
      <div className="flex items-center gap-1 pl-3.5 pr-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 py-2 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm font-semibold ${title.trim() ? "text-ink" : "text-ink-faint"}`}>
              {title.trim() || placeholderTitle}
            </span>
            {subtitle?.trim() && (
              <span className="block truncate text-xs text-ink-muted">{subtitle}</span>
            )}
          </span>
          <IconChevronDown
            size={16}
            className={`shrink-0 text-ink-faint transition ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {open && (
        <div className="space-y-3 border-t border-line px-3.5 pb-3.5 pt-3.5">
          {children}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex gap-1">
              <button
                type="button"
                className="btn-icon h-8 w-8"
                onClick={() => onMove(-1)}
                disabled={index === 0}
                aria-label="Move up"
                title="Move up"
              >
                <IconArrowLeft size={15} className="rotate-90" />
              </button>
              <button
                type="button"
                className="btn-icon h-8 w-8"
                onClick={() => onMove(1)}
                disabled={index === count - 1}
                aria-label="Move down"
                title="Move down"
              >
                <IconArrowLeft size={15} className="-rotate-90" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => (confirming ? onRemove() : setConfirming(true))}
              className={`btn btn-sm ${confirming ? "bg-red-600 text-white hover:bg-red-700" : "btn-ghost text-red-700 hover:bg-red-50"}`}
            >
              <IconTrash size={15} />
              {confirming ? "Tap again to remove" : "Remove"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bullet list editor. Enter adds a bullet below, Backspace on an empty
 * bullet removes it, pasting several lines splits them into bullets.
 */
export function BulletEditor({
  bullets,
  onChange,
  placeholder,
}: {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  placeholder: string;
}) {
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const focusIndex = useRef<number | null>(null);
  const list = bullets.length ? bullets : [""];

  useEffect(() => {
    if (focusIndex.current === null) return;
    const el = refs.current[focusIndex.current];
    focusIndex.current = null;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  });

  const update = (index: number, value: string) => {
    const lines = value.split(/\r?\n/);
    if (lines.length > 1) {
      // Pasted or typed newline: split into separate bullets.
      const cleaned = lines.map((l, i) => (i === 0 ? l : l.replace(/^\s*[-•●▪◦*]\s*/, "")));
      const next = [...list.slice(0, index), ...cleaned, ...list.slice(index + 1)];
      focusIndex.current = index + cleaned.length - 1;
      onChange(next);
      return;
    }
    const next = [...list];
    next[index] = value;
    onChange(next);
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const el = event.currentTarget;
      const before = list[index].slice(0, el.selectionStart);
      const after = list[index].slice(el.selectionEnd);
      const next = [...list.slice(0, index), before, after, ...list.slice(index + 1)];
      focusIndex.current = index + 1;
      onChange(next);
    } else if (event.key === "Backspace" && list[index] === "" && list.length > 1) {
      event.preventDefault();
      focusIndex.current = Math.max(0, index - 1);
      onChange(list.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <span className="field-label">Bullet points</span>
      <ul className="space-y-1.5">
        {list.map((bullet, index) => (
          <li key={index} className="group relative flex items-start gap-2">
            <span className="mt-[15px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" aria-hidden />
            <AutoTextarea
              textareaRef={(el) => {
                refs.current[index] = el;
              }}
              value={bullet}
              minRows={1}
              placeholder={index === 0 ? placeholder : "Another achievement…"}
              onChange={(e) => update(index, e.target.value)}
              onKeyDown={(e) => onKeyDown(index, e)}
              aria-label={`Bullet ${index + 1}`}
              className="pr-9"
            />
            {list.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(list.filter((_, i) => i !== index))}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-ink-faint opacity-60 transition hover:bg-paper hover:text-ink group-focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Remove bullet ${index + 1}`}
              >
                <IconX size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            focusIndex.current = list.length;
            onChange([...list, ""]);
          }}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-soft hover:text-ink"
        >
          <IconPlus size={14} /> Add bullet
        </button>
        <span className="text-[11px] text-ink-faint">Enter = new bullet · paste a list to split</span>
      </div>
    </div>
  );
}

/** Immutable list helpers shared by every repeatable section. */
export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
