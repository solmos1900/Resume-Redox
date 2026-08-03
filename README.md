# Resume Redox

A local-first resume builder with live ATS-friendly preview and role-specific versions saved in your browser.

## Features

- **Live preview** — edit in the center, see the resume update instantly
- **Resume sidebar** — collapsible list of all resumes
- **Templates** — switch ATS-safe layouts per resume version
- **Save PDF / Print** — opens a print preview; use your browser’s “Save as PDF”
- **Backup & Import** — download/upload a JSON backup of all resumes
- **No account required** — all data persists in localStorage

AI Coach, job-URL fetch, server PDF (Puppeteer), and disk sync are **archived** under [`_archived/`](_archived/README.md) for later re-enable.

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
4. No environment variables required for core features.
5. Deploy.

Or from the CLI:

```bash
npm i -g vercel
vercel
```

Hobby plan supports multiple personal projects under one account (shared usage limits).

## Creating resumes

1. Sidebar → **+ New resume**
2. Choose **Blank** or **From existing resume**
3. Name it and create
4. Edit in the center panel; switch templates in Preview
5. **Save PDF** or **Print** → choose “Save as PDF” in the browser dialog

## Save vs Print

| Button | Action |
|--------|--------|
| **Save PDF** | Opens print preview; choose “Save as PDF” in the dialog |
| **Print** | Same print preview flow |

Both use filename `{Resume Name} - {Your Name}` via the browser’s save dialog where supported.

## Resume templates

| Template | Best for |
|----------|----------|
| **Classic ATS** | Default; traditional underlined sections |
| **Modern Clean** | Minimal, spacious layout |
| **Compact Professional** | Long experience histories |
| **Executive Formal** | Senior roles; centered header |
| **Clear Structure** | Strong section labels for scanning |

All templates use single-column layout, semantic HTML, system fonts, and no tables/images — optimized for applicant tracking systems.

## Re-enabling archived features

See [`_archived/README.md`](_archived/README.md) for restore steps (AI Coach, Puppeteer PDF, server file sync).
