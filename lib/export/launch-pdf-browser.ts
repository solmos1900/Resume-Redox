import fs from "node:fs";
import type { Browser } from "puppeteer-core";

/** Remote Chromium pack for Vercel / serverless (@sparticuz/chromium-min). */
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_REMOTE_EXEC_PATH ||
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.1/chromium-v147.0.1-pack.x64.tar";

type PuppeteerCore = {
  launch: (options: Record<string, unknown>) => Promise<Browser>;
  defaultArgs: (options: Record<string, unknown>) => string[] | Promise<string[]>;
};

type SparticuzChromium = {
  args: string[];
  setGraphicsMode: boolean;
  executablePath: (input?: string) => Promise<string>;
};

function unwrap<T>(mod: T | { default: T }): T {
  if (mod && typeof mod === "object" && "default" in mod && (mod as { default: T }).default) {
    return (mod as { default: T }).default;
  }
  return mod as T;
}

/**
 * Launch Chromium for text PDF generation.
 * Uses dynamic import("puppeteer-core") — never "@puppeteer-core".
 * Packages are serverExternalPackages + statically imported in the API route
 * so Vercel NFT includes them under /var/task/node_modules.
 */
export async function launchPdfBrowser(): Promise<Browser> {
  const isServerless =
    process.env.VERCEL === "1" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME != null ||
    process.env.FORCE_SERVERLESS_CHROMIUM === "1";

  const puppeteer = unwrap(
    await import("puppeteer-core")
  ) as unknown as PuppeteerCore;

  if (isServerless) {
    const chromium = unwrap(
      await import("@sparticuz/chromium-min")
    ) as unknown as SparticuzChromium;
    chromium.setGraphicsMode = false;
    const args = await puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    });
    return puppeteer.launch({
      args,
      defaultViewport: {
        width: 816,
        height: 1056,
        deviceScaleFactor: 1,
      },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: "shell",
    });
  }

  const executablePath =
    process.env.CHROMIUM_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    findLocalChrome();

  if (!executablePath) {
    const chromium = unwrap(
      await import("@sparticuz/chromium-min")
    ) as unknown as SparticuzChromium;
    chromium.setGraphicsMode = false;
    return puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: "shell",
    });
  }

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=none",
    ],
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
