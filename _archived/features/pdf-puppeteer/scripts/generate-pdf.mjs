import fs from "fs";
import puppeteer from "puppeteer";

const previewUrl = process.argv[2];

if (!previewUrl) {
  console.error("Usage: node scripts/generate-pdf.mjs <preview-url>");
  process.exit(1);
}

function findChromeExecutable() {
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
            `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
          ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

const executablePath = findChromeExecutable();

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  ...(executablePath ? { executablePath } : {}),
});

try {
  const page = await browser.newPage();
  await page.goto(previewUrl, {
    waitUntil: "networkidle0",
    timeout: 60_000,
  });
  await page.waitForSelector("#resume-export-root", { timeout: 30_000 });
  await page.emulateMediaType("print");

  const pdf = await page.pdf({
    format: "letter",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  });

  process.stdout.write(pdf);
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await browser.close();
}
