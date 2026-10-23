/**
 * End-to-end check of the core user journeys (see docs/USER_JOURNEYS.md).
 *
 *   npm run build && npm start          # or npm run dev
 *   npm run test:journeys               # BASE_URL defaults to http://localhost:3000
 *
 * Runs without Firebase config: PDF download is expected to fall back to the
 * browser print view. Screenshots land in tmp-journeys/ (gitignored).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "tmp-journeys");
fs.mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL ?? "http://localhost:3000";
let failures = 0;
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
// Network failures (e.g. Firebase with placeholder config) are covered by the
// assertions themselves; anything else logged as an error fails the run.
p.on("console", (m) => {
  if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) {
    errors.push("console: " + m.text());
  }
});
const ok = (name, cond) => {
  if (!cond) failures++;
  console.log((cond ? "PASS " : "FAIL ") + name);
};

// J2: landing import deep link -> import dialog (new target)
await p.goto(base + "/app?start=import", { waitUntil: "networkidle" });
await p.waitForTimeout(600);
ok("deep link opens import dialog", await p.getByText("Import your resume").isVisible());
ok("deep link url cleaned", p.url().endsWith("/app"));
await p.setInputFiles("#import-file-input", path.join(root, "fixtures/import/jordan-lee-pm.pdf"));
await p.getByText("Check what we found").waitFor({ timeout: 30000 });
await p.screenshot({ path: `${out}/30-import-review.png` });
ok("import review says new resume", await p.getByText("This is saved as a new resume").isVisible());
await p.getByRole("button", { name: /Looks good — open it/ }).click();
await p.waitForTimeout(800);
const nameVal = await p.getByLabel("Full name").inputValue();
ok("imported into editor: " + nameVal, nameVal.length > 0);
await p.screenshot({ path: `${out}/31-after-import.png` });

// Bullet editor: Enter creates a new bullet
const bullets = p.getByLabel(/^Bullet 1$/);
if (await bullets.count() === 0) {
  // expand first experience entry
  await p.locator("#editor-section-experience button[aria-expanded=false]").first().click();
}
const b1 = p.getByLabel(/^Bullet 1$/).first();
const before = await p.getByLabel(/^Bullet \d+$/).count();
await b1.click();
await b1.press("Control+End");
await b1.press("Enter");
await p.keyboard.type("Shipped a brand new thing");
const after = await p.getByLabel(/^Bullet \d+$/).count();
ok(`Enter adds bullet (${before}->${after})`, after === before + 1);
ok("new bullet shows in preview", await p.locator("#resume-preview").getByText("Shipped a brand new thing").isVisible());

// Downloads
async function dl(label) {
  await p.getByRole("button", { name: "Download" }).click();
  const [d] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }), p.getByRole("menuitem", { name: label }).click()]);
  return d.suggestedFilename();
}
ok("docx download: " + (await dl(/Word/)), true);
ok("txt download: " + (await dl(/Plain text/)), true);

// PDF -> fallback (no Firebase in this env)
await p.getByRole("button", { name: "Download" }).click();
await p.getByRole("menuitem", { name: /PDF/ }).click();
await p.getByText("Save your PDF from the print view").waitFor({ timeout: 15000 });
await p.screenshot({ path: `${out}/32-pdf-fallback.png` });
const [popup] = await Promise.all([ctx.waitForEvent("page"), p.getByRole("button", { name: "Open print view" }).click()]);
await popup.waitForLoadState();
await popup.waitForTimeout(800);
ok("print view opened with resume", await popup.locator(".resume-document").count() > 0);
ok("no false pop-up-blocked toast", !(await p.getByText(/blocked/).isVisible()));
await popup.close();

// Job match
await p.getByRole("button", { name: /Job match/ }).click();
await p.getByPlaceholder("Paste the full job posting here…").fill(
  "We are hiring a Senior Product Manager to own our payments platform roadmap. You will run discovery with customers, define requirements, and partner with engineering on delivery. Experience with SQL, A/B testing, and Figma is a plus. Strong stakeholder management and experimentation skills required. Payments or fintech experience preferred. Product Manager experience 5+ years.");
await p.waitForTimeout(500);
ok("free keyword check shows", await p.getByText(/key terms from this posting/).isVisible());
await p.screenshot({ path: `${out}/33-job-match.png` });
const chip = p.locator("button[title^='Mentioned']").first();
const term = (await chip.innerText()).trim();
await chip.click();
await p.waitForTimeout(300);
ok(`clicked missing term '${term}' -> moved to covered`, await p.locator("span", { hasText: term }).filter({ hasNot: p.locator("button") }).count() > 0);

// Design: switch template via Design tab, accent color hidden for classic
await p.getByRole("button", { name: /^Design$/ }).click();
await p.getByRole("button", { name: /Accent Clean/ }).first().click();
await p.waitForTimeout(300);
ok("accent template shows color swatches", await p.getByLabel(/Accent color #/).first().isVisible());
await p.screenshot({ path: `${out}/34-design-accent.png` });

// J14: free ATS check shows parsed fields and issues; Go jumps to the section
await p.getByRole("button", { name: /ATS check/ }).first().click();
await p.getByText("How an ATS reads your resume").waitFor();
ok("ATS check shows parsed name", await p.getByText("Contact details it found").isVisible());
ok("ATS check counts checks", await p.getByText(/\d+ of \d+ checks passed/).isVisible());
ok("ATS check lists parsed jobs", (await p.getByText("Work history it found").count()) === 1);
const go = p.getByRole("button", { name: /^Go/ }).first();
if (await go.count()) {
  await go.click();
  await p.waitForTimeout(400);
  ok("ATS Go jumps to Content", await p.locator("#editor-section-contact").isVisible());
} else {
  ok("ATS clean parse", await p.getByText("Clean parse").isVisible());
}

// J13: Pro entry points open the upgrade dialog; waitlist never fakes success
await p.getByRole("button", { name: /Content/ }).first().click();
await p.getByRole("button", { name: /Check spelling & grammar/ }).click();
ok("spell check opens Pro dialog", await p.getByRole("dialog").getByText(/\$\d+/).first().isVisible());
await p.keyboard.press("Escape");
await p.getByRole("button", { name: /Job match/ }).click();
await p.getByRole("button", { name: /Score & tailor my resume/ }).click();
const dlg = p.getByRole("dialog");
ok("tailor opens Pro dialog leading with that feature", await dlg.getByText("AI job match & tailoring").first().isVisible());
await dlg.getByRole("radio", { name: /Monthly/ }).click();
ok("monthly price shown", await dlg.getByText("/ month").isVisible());
await dlg.getByPlaceholder("you@email.com").fill("test@example.com");
await dlg.getByRole("button", { name: "Join the waitlist" }).click();
await p.waitForTimeout(1500);
const saved = await dlg.getByText("You're on the list").isVisible();
const honestError = await dlg.getByRole("alert").isVisible();
ok(`waitlist: ${saved ? "saved" : "honest error shown"}`, saved || honestError);
await p.keyboard.press("Escape");

// Back home, dashboard actions
await p.getByRole("button", { name: /Back to my resumes/ }).click();
await p.waitForTimeout(500);
const cardCount = () => p.getByRole("button", { name: /^More actions for/ }).count();
const cards = await cardCount();
await p.getByRole("button", { name: /More actions for/ }).first().click();
await p.getByRole("menuitem", { name: "Duplicate" }).click();
await p.waitForTimeout(400);
await p.getByRole("button", { name: /Back to my resumes/ }).click();
await p.waitForTimeout(400);
const n2 = await cardCount(); ok(`duplicate adds a card (${cards} -> ${n2})`, n2 === cards + 1);
await p.getByRole("button", { name: /More actions for/ }).first().click();
await p.getByRole("menuitem", { name: "Rename" }).click();
await p.getByRole("textbox", { name: "Name" }).fill("PM — Stripe");
await p.getByRole("button", { name: "Save" }).click();
ok("rename applied", await p.getByText("PM — Stripe").isVisible());
await p.getByRole("button", { name: /More actions for PM — Stripe/ }).click();
await p.getByRole("menuitem", { name: /Delete/ }).click();
await p.getByRole("button", { name: "Delete", exact: true }).click();
await p.waitForTimeout(300);
ok("delete removes it", !(await p.getByText("PM — Stripe").isVisible()));
await p.screenshot({ path: `${out}/35-home-after.png` });

ok("job alerts card on home", await p.getByRole("button", { name: /Turn on job alerts/ }).isVisible());

// Reload: editor state persists, lands where left off
await p.getByRole("button", { name: /^Open / }).first().click();
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(600);
ok("reload resumes in editor", await p.getByRole("button", { name: /Back to my resumes/ }).isVisible());
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
if (failures || errors.length) {
  console.error(`\n${failures} journey check(s) failed, ${errors.length} console error(s).`);
  process.exit(1);
}
console.log("\nAll journey checks passed.");
