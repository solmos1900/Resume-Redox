import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

/**
 * Optional standalone PDF worker browser launcher.
 * Resolves puppeteer-core / @sparticuz/chromium-min from process.cwd()
 * (package name is "puppeteer-core", never "@puppeteer-core").
 */
export async function launchPdfBrowser() {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const puppeteer = require("puppeteer-core");

  const isServerless =
    process.env.VERCEL === "1" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME != null ||
    process.env.FORCE_SERVERLESS_CHROMIUM === "1";

  const CHROMIUM_PACK_URL =
    process.env.CHROMIUM_REMOTE_EXEC_PATH ||
    "https://github.com/Sparticuz/chromium/releases/download/v147.0.1/chromium-v147.0.1-pack.x64.tar";

  if (isServerless) {
    const chromium = require("@sparticuz/chromium-min");
    chromium.setGraphicsMode = false;
    const args = await puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    });
    return puppeteer.launch({
      args,
      defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
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
    const chromium = require("@sparticuz/chromium-min");
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
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 1 },
  });
}
