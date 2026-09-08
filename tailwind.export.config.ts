import type { Config } from "tailwindcss";

/** Content scan for PDF export CSS — same markup Chromium setContent renders. */
const config: Config = {
  content: [
    "./components/preview/templates/**/*.{ts,tsx}",
    "./components/preview/ContactLine.tsx",
    "./lib/templates/sections.tsx",
    "./lib/export/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
