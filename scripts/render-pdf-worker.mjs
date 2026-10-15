/**
 * Standalone PDF worker — outside Next webpack so setContent HTML/CSS stay intact.
 * stdin: ResumeVersion JSON → stdout: PDF bytes
 *
 * Resolves packages with createRequire(process.cwd()/package.json):
 *   require("puppeteer-core")  — NOT "@puppeteer-core"
 *   require("@sparticuz/chromium-min")
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { launchPdfBrowser } from "./pdf-worker-browser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRoot = createRequire(path.join(root, "package.json"));
const { buildResumeExportHtml } = requireFromRoot(
  path.join(root, "lib/export/generated/build-resume-html.cjs")
);
const { PDFDocument } = requireFromRoot("pdf-lib");

/**
 * Chromium leaves Creator as the browser UA and omits Author. Rewrite document
 * info so ATS checkers and OS preview show the candidate name cleanly.
 */
async function applyAtsPdfMetadata(pdfBytes, version) {
  const author =
    (version.contact?.fullName || "").trim() ||
    (version.name || "").trim() ||
    "Resume";
  const title = author;
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(author);
  pdfDoc.setSubject("Resume");
  pdfDoc.setCreator("Resume Redox");
  pdfDoc.setProducer("Resume Redox");
  return Buffer.from(await pdfDoc.save());
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const version = JSON.parse(await readStdin());
  const html = buildResumeExportHtml(version);
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForSelector("#resume-export-root .resume-document", {
      timeout: 15_000,
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.emulateMediaType("screen");
    await page.addStyleTag({
      content: `
        html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
        .resume-document a { color: inherit !important; }
      `,
    });
    const pdf = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const withMeta = await applyAtsPdfMetadata(Buffer.from(pdf), version);
    process.stdout.write(withMeta);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
