# Resume Redox

**The free resume builder that doesn't charge you at the finish line.** Live preview, ATS-friendly templates, unlimited resumes, and free PDF / Word / text downloads — no watermark, no account required.

- `/` — landing page (static)
- `/app` — the builder: **Home** (My resumes) → **Template gallery** → **Editor** (Content · Design · Job match + live preview)

User journeys, what each screen is for, and what changed in the redesign: **[docs/USER_JOURNEYS.md](docs/USER_JOURNEYS.md)**. Product strategy: [docs/PRD.md](docs/PRD.md).

## Features

- **No sign-up wall** — everything saves locally in the browser from the first keystroke; an account only adds cross-device sync
- **Import** a PDF or Word resume, review every field, then open it
- **Live templates** — 6 single-column, ATS-safe layouts; thumbnails are real renders of your own resume
- **Design** — font, size, spacing, accent color, section order, heading style
- **Job match** — paste a posting, see which key terms you cover; tap to add missing ones (free, runs locally)
- **Download** — PDF (Chromium text PDF of the same templates), Word, plain text, print; graceful Save-as-PDF fallback
- **Unlimited resumes** — duplicate, tailor a copy per job, backup/restore as JSON
- **Mobile-first editor** — bottom navigation, full-size preview a tap away

**Free forever, paid AI.** The only paid tier is **Redox Pro** ($5/month or $48/year, recurring): AI job match & tailoring, spelling & grammar check, bullet enhancer, and job-alert emails that build a tailored resume. Billing isn't live yet — Pro entry points collect a waitlist (Firestore `proWaitlist`; rule in [docs/MONETIZATION.md](docs/MONETIZATION.md)). Archived AI code lives under [`_archived/`](_archived/README.md).

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Framework preset: **Next.js** (auto-detected). Build command `npm run build`, output default.
4. Set Firebase env vars (see [Environment variables](#environment-variables) below) and, in Firebase Console → Authentication → Sign-in method, enable **Google**, **Email/Password**, and **Anonymous** (anonymous = silent guest token so signed-out users get the server PDF).
5. Deploy.

## Environment variables

Copy [`.env.example`](.env.example) for a full list.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Recommended | Optional sign-in / cloud sync, and guest tokens for server PDF. Without it the app still works fully; PDF uses the print-view fallback. |
| `FIREBASE_PROJECT_ID` | Recommended | Server verification of Firebase ID tokens for `POST /api/export-pdf`. Falls back to `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. **If neither is set, PDF export denies requests (503)** — fail closed. |
| `PDF_EXPORT_MAX_CONCURRENCY` | No (default `2`) | Max concurrent Chromium PDF workers per serverless isolate |
| `PDF_EXPORT_TIMEOUT_MS` | No (default `45000`) | Hard kill timeout for the PDF worker / browser |

**PDF export security:** `POST /api/export-pdf` requires `Authorization: Bearer <Firebase ID token>` (a signed-in account or a silent anonymous guest session), caps JSON body size (256 KiB) and field sizes, rate-limits per user (5/min) and IP (10/min), and kills timed-out Chromium workers. Rate limits use an **in-memory** store per serverless isolate — they reduce abuse on warm instances but are not a durable global quota across Vercel instances. A Redis-backed limiter can be added later if needed.

Or from the CLI:

```bash
npm i -g vercel
vercel
```

Hobby plan supports multiple personal projects under one account (shared usage limits). PDF generation uses `@sparticuz/chromium-min` (remote Chromium pack) in the serverless function (`maxDuration` 60s; Pro recommended for cold starts).

## Using the app

1. **Home → Import my resume** (PDF/DOCX), **Start from scratch** (pick a template), or **Explore the sample**
2. Edit in **Content**; restyle in **Design**; check keywords in **Job match**
3. **Download → PDF** to apply, or Word / plain text for picky portals

## Testing

| Command | What it checks |
|---|---|
| `npm run lint` / `npx tsc --noEmit` | Lint + types |
| `npm run test:import-fixtures` | PDF/DOCX import golden files |
| `npm run test:export-pdf-security` | PDF API auth, limits, timeouts |
| `npm run test:cloud-sync-lifecycle` / `test:cloud-sync-save-queue` | Sync session + write ordering |
| `npm run test:journeys` | Browser run of the core user journeys against `BASE_URL` (default `http://localhost:3000`; start the app first). Set `CHROMIUM_PATH` if Playwright's bundled browser isn't installed. |

## Save vs Print

| Button | Action |
|--------|--------|
| **Download → PDF** | Text letter PDF via Chromium of the active template (WYSIWYG + selectable text). Falls back to the print view if the PDF service is unavailable. |
| **Download → Word / ATS text** | `.docx` with real text — same sections/order as preview; not a pixel twin |
| **Download → Plain Text** | `.txt` with the same content order |
| **Download → Print** | Browser print dialog — choose **Save as PDF** and turn off **Headers and footers** |

### Export fidelity

- **PDF** = single visual path: the same `ResumeTemplateSwitch` components as the editor preview, rendered to self-contained HTML (inlined export CSS) and printed by Chromium/Skia via `page.setContent` — **no HTTP fetch** of `/export/preview` (SSO-safe under Vercel Deployment Protection). Text PDF, not html2canvas raster.
- **DOCX / TXT** = dual content path on purpose: shared section order via `lib/export/export-blocks.ts`, clean ATS layout, labeled in the Download menu so Word is not mistaken for Accent Clean.

## Resume templates

| Template | Best for |
|----------|----------|
| **Classic ATS** | Default; traditional underlined sections |
| **Modern Clean** | Minimal, spacious layout |
| **Compact Professional** | Long experience histories |
| **Executive Formal** | Senior roles; centered header |
| **Clear Structure** | Strong section labels for scanning |
| **Accent Clean** | Accent-blue headers; still single-column for ATS |

All templates use single-column layout, semantic HTML, system fonts, and no tables/images — optimized for applicant tracking systems.

## Re-enabling archived features

See [`_archived/README.md`](_archived/README.md) for restore steps (AI Coach, server file sync). Puppeteer PDF is superseded by the in-app `/api/export-pdf` Chromium path.
