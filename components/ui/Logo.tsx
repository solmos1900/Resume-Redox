import Link from "next/link";

/** Wordmark: "Redox" set in Fraunces with the oxide dot. */
export function Logo({
  href = "/",
  compact = false,
  className = "",
}: {
  href?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const mark = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink font-display text-[17px] font-semibold text-paper"
      >
        R
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-paper" />
      </span>
      {!compact && (
        <span className="font-display text-[19px] font-semibold tracking-tight text-ink">
          Resume Redox
        </span>
      )}
      {compact && <span className="sr-only">Resume Redox</span>}
    </span>
  );

  if (href === null) return mark;
  return (
    <Link
      href={href}
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label="Resume Redox home"
    >
      {mark}
    </Link>
  );
}
