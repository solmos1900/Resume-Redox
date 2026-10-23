import { IconSparkle } from "@/components/ui/icons";

/** Marks an AI feature that's part of Redox Pro. */
export function ProBadge({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
        tone === "dark" ? "bg-white/15 text-brand-200" : "bg-brand-100 text-brand-700"
      } ${className}`}
    >
      <IconSparkle size={10} /> Pro
    </span>
  );
}
