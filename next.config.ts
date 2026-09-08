import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
  // Keep the setContent HTML bundle inside the serverless function FS.
  outputFileTracingIncludes: {
    "/api/export-pdf": [
      "./lib/export/generated/**/*",
      "./scripts/render-pdf-worker.mjs",
      "./scripts/pdf-worker-browser.mjs",
    ],
  },
};

export default nextConfig;
