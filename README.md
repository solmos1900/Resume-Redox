# Resume Redox

A local-first resume builder with live ATS-friendly preview and role-specific versions saved in your browser.

## Features

- **Live preview** — edit in the center, see the resume update instantly
- **Mobile-friendly** — on phones/tablets, switch between Resumes, Edit, and Preview via a bottom tab bar; the letter-size preview scales to fit your screen while print/PDF stays full size
- **Resume sidebar** — collapsible list of all resumes
- **Templates** — switch ATS-safe layouts per resume version
- **Download → PDF** — Chromium text PDF of the **same React templates** as the live preview (selectable text, embedded fonts, US Letter, no browser URL footer / Vercel toolbar)
- **Download → Word / TXT** — ATS text siblings with the **same content and section order** as preview (not a visual twin of Accent/etc.)
- **Backup & Import** — download/upload a JSON backup of all resumes
- **Signed-in PDF export** — Chromium PDF generation requires a Firebase account (server-verified); resume data still persists in localStorage / cloud sync

AI Coach, job-URL fetch, and disk sync are **archived** under [`_archived/`](_archived/README.md) for later re-enable.

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
4. Set Firebase env vars (see [Environment variables](#environment-variables) below). Sign-in and PDF export both require them.
5. Deploy.

## Environment variables

Copy [`.env.example`](.env.example) for a full list.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Yes (for auth UI) | Client Firebase config used by `AuthGate` / sign-in |
| `FIREBASE_PROJECT_ID` | Recommended | Server verification of Firebase ID tokens for `POST /api/export-pdf`. Falls back to `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. **If neither is set, PDF export denies requests (503)** — fail closed. |
| `PDF_EXPORT_MAX_CONCURRENCY` | No (default `2`) | Max concurrent Chromium PDF workers per serverless isolate |
| `PDF_EXPORT_TIMEOUT_MS` | No (default `45000`) | Hard kill timeout for the PDF worker / browser |

**PDF export security:** `POST /api/export-pdf` requires `Authorization: Bearer <Firebase ID token>`, caps JSON body size (256 KiB) and field sizes, rate-limits per user (5/min) and IP (10/min), and kills timed-out Chromium workers. Rate limits use an **in-memory** store per serverless isolate — they reduce abuse on warm instances but are not a durable global quota across Vercel instances. A Redis-backed limiter can be added later if needed.

Or from the CLI:

```bash
npm i -g vercel
vercel
```

Hobby plan supports multiple personal projects under one account (shared usage limits). PDF generation uses `@sparticuz/chromium-min` (remote Chromium pack) in the serverless function (`maxDuration` 60s; Pro recommended for cold starts).

## Creating resumes

1. Sidebar → **+ New resume**
2. Choose **Blank** or **From existing resume**
3. Name it and create
4. Edit in the center panel; switch templates in Preview
5. **Download → PDF** for the visual deliverable, or **Word / ATS text** for parsers

## Save vs Print

| Button | Action |
|--------|--------|
| **Download → PDF** | Text letter PDF via Chromium of the active template (WYSIWYG + selectable text) |
| **Download → Word / ATS text** | `.docx` with real text — same sections/order as preview; not a pixel twin |
| **Download → Plain Text** | `.txt` with the same content order |
| **Print** | Browser print dialog — turn off **Headers and footers** |

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
