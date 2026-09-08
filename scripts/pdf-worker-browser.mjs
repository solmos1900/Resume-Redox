import fs from "node:fs";

/**
 * Launch Chromium for the standalone PDF worker (no Next/TS).
 * Mirrors lib/export/launch-pdf-browser.ts.
 */
export async function launchPdfBrowser() {
  const puppeteer = await import("puppeteer-core");
  const isServerless =
    process.env.VERCEL === "1" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME != null ||
    process.env.FORCE_SERVERLESS_CHROMIUM === "1";

  const CHROMIUM_PACK_URL =
    process.env.CHROMIUM_REMOTE_EXEC_PATH ||
    "https://github.com/Sparticuz/chromium/releases/download/v147.0.1/chromium-v147.0.1-pack.x64.tar";

  if (isServerless) {
    const chromium = await import("@sparticuz/chromium-min");
    chromium.default.setGraphicsMode = false;
    const args = await puppeteer.default.defaultArgs({
      args: chromium.default.args,
      headless: "shell",
    });
    return puppeteer.default.launch({
      args,
      defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 1 },
      executablePath: await chromium.default.executablePath(CHROMIUM_PACK_URL),
      headless: "shell",
    });
  }

  const candidates = [
    process.env.CHROMIUM_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/local/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  const executablePath = candidates.find((p) => fs.existsSync(p));

  if (!executablePath) {
    const chromium = await import("@sparticuz/chromium-min");
    chromium.default.setGraphicsMode = false;
    return puppeteer.default.launch({
      args: [...chromium.default.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.default.executablePath(CHROMIUM_PACK_URL),
      headless: "shell",
    });
  }

  return puppeteer.default.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 1 },
  });
}
