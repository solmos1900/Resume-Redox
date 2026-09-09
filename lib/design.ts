import type { CSSProperties } from "react";
import type {
  DesignFontFamily,
  DesignFontSize,
  DesignSettings,
  DesignSpacing,
  ResumeVersion,
} from "@/lib/schema";
import { DEFAULT_DESIGN_SETTINGS } from "@/lib/schema";

export const DESIGN_FONT_OPTIONS: {
  id: DesignFontFamily;
  label: string;
  stack: string;
}[] = [
  {
    id: "arial",
    label: "Arial",
    stack: "Arial, Helvetica, sans-serif",
  },
  {
    id: "calibri",
    label: "Calibri",
    stack: 'Calibri, Candara, "Segoe UI", sans-serif',
  },
  {
    id: "georgia",
    label: "Georgia",
    stack: "Georgia, Times New Roman, serif",
  },
  {
    id: "garamond",
    label: "Garamond",
    stack: "Garamond, Baskerville, Georgia, serif",
  },
  {
    id: "times",
    label: "Times New Roman",
    stack: '"Times New Roman", Times, serif',
  },
];

export const DESIGN_FONT_SIZE_OPTIONS: {
  id: DesignFontSize;
  label: string;
}[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

export const DESIGN_SPACING_OPTIONS: {
  id: DesignSpacing;
  label: string;
}[] = [
  { id: "comfortable", label: "Comfortable" },
  { id: "compact", label: "Compact" },
  { id: "tight", label: "Tight" },
];

/** Accent swatches for the Design panel (Accent template tokens). */
export const ACCENT_SWATCHES = [
  "#1e5aa8",
  "#0f766e",
  "#b45309",
  "#7c2d12",
  "#374151",
] as const;

const FONT_STACKS: Record<DesignFontFamily, string> = Object.fromEntries(
  DESIGN_FONT_OPTIONS.map((o) => [o.id, o.stack])
) as Record<DesignFontFamily, string>;

export function getDesignSettings(
  version: Pick<ResumeVersion, "design"> | null | undefined
): DesignSettings {
  return {
    ...DEFAULT_DESIGN_SETTINGS,
    ...version?.design,
  };
}

export function normalizeAccentColor(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return DEFAULT_DESIGN_SETTINGS.accentColor;
}

export function designDocumentStyle(design: DesignSettings): CSSProperties {
  return {
    fontFamily: FONT_STACKS[design.fontFamily] ?? FONT_STACKS.arial,
    // Accent template reads --accent; Classic/others ignore it (monochrome).
    ["--accent" as string]: normalizeAccentColor(design.accentColor),
  };
}

export function designDocumentProps(design: DesignSettings): {
  style: CSSProperties;
  "data-font-size": DesignFontSize;
  "data-spacing": DesignSpacing;
} {
  return {
    style: designDocumentStyle(design),
    "data-font-size": design.fontSize,
    "data-spacing": design.spacing,
  };
}
