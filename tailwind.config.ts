import type { Config } from "tailwindcss";

/**
 * App chrome design tokens. Resume templates keep using Tailwind's stock gray
 * palette (shared with tailwind.export.config.ts) so preview and PDF match —
 * do not remap `gray` here.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F6F3EE",
          deep: "#ECE7DF",
        },
        ink: {
          DEFAULT: "#1A1815",
          soft: "#3B3731",
          muted: "#6D675E",
          faint: "#9D968B",
        },
        line: {
          DEFAULT: "#E5DFD5",
          strong: "#CDC5B8",
        },
        // "Oxide" — the redox accent. Used sparingly: primary actions, focus, highlights.
        brand: {
          50: "#FFF4EE",
          100: "#FFE5D6",
          200: "#FFC8AA",
          300: "#FFA275",
          400: "#FB743E",
          500: "#EE5419",
          600: "#D7410D",
          700: "#B2320D",
          800: "#8E2B12",
          900: "#742712",
        },
        moss: {
          50: "#EEF6F0",
          100: "#D7EBDC",
          500: "#3B8A55",
          600: "#2E7045",
          700: "#255A38",
        },
      },
      fontFamily: {
        sans: [
          '"Inter Variable"',
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: ['"Fraunces Variable"', "Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,24,21,0.04), 0 6px 20px -8px rgba(26,24,21,0.10)",
        lift: "0 2px 4px rgba(26,24,21,0.05), 0 18px 40px -16px rgba(26,24,21,0.22)",
        pop: "0 1px 3px rgba(26,24,21,0.08), 0 24px 60px -18px rgba(26,24,21,0.35)",
        page: "0 1px 2px rgba(26,24,21,0.06), 0 12px 32px -10px rgba(26,24,21,0.18)",
      },
      borderRadius: {
        xl2: "1.125rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "sheet-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 260ms cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in 180ms ease-out both",
        "sheet-up": "sheet-up 280ms cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
