import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint stays a separate `npm run lint` / test:lint-config gate. Pre-existing
  // source findings must not fail `next build` once eslint.config.mjs exists.
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    "@sparticuz/chromium-min",
    "puppeteer-core",
    "pdfjs-dist",
    "mammoth",
  ],
  // Keep HTML bundle, worker scripts, and Chromium deps in the function FS.
  outputFileTracingIncludes: {
    "/api/export-pdf": [
      "./lib/export/generated/**/*",
      "./scripts/render-pdf-worker.mjs",
      "./scripts/pdf-worker-browser.mjs",
      "./node_modules/puppeteer-core/**/*",
      "./node_modules/@sparticuz/chromium-min/**/*",
      "./node_modules/@puppeteer/browsers/**/*",
    ],
    "/api/import-parse": [
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/mammoth/**/*",
    ],
  },
};

export default nextConfig;
