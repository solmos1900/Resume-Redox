import fs from "node:fs";
import type { Browser } from "puppeteer-core";

/** Remote Chromium pack for Vercel / serverless (@sparticuz/chromium-min). */
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_REMOTE_EXEC_PATH ||
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.1/chromium-v147.0.1-pack.x64.tar";

/**
 * Launch Chromium for text PDF generation.
 * - Production / Vercel: @sparticuz/chromium-min + remote pack (stays under
 *   serverless bundle limits)
 * - Local: system Chrome / Chromium when available
 */
export async function launchPdfBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");
  const isServerless =
    process.env.VERCEL === "1" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME != null ||
    process.env.FORCE_SERVERLESS_CHROMIUM === "1";

  if (isServerless) {
    const chromium = await import("@sparticuz/chromium-min");
    chromium.default.setGraphicsMode = false;
    const args = await puppeteer.default.defaultArgs({
      args: chromium.default.args,
      headless: "shell",
    });
    return puppeteer.default.launch({
      args,
      defaultViewport: {
        width: 816,
        height: 1056,
        deviceScaleFactor: 1,
      },
      executablePath: await chromium.default.executablePath(CHROMIUM_PACK_URL),
      headless: "shell",
    });
  }

  const executablePath =
    process.env.CHROMIUM_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    findLocalChrome();

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
    defaultViewport: {
      width: 816,
      height: 1056,
      deviceScaleFactor: 1,
    },
  });
}

function findLocalChrome(): string | null {
  const candidates =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
      : process.platform === "win32"
        ? [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          ]
        : [
            "/usr/bin/google-chrome-stable",
            "/usr/bin/google-chrome",
            "/usr/local/bin/google-chrome",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
          ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}
