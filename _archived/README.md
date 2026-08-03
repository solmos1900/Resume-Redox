# Archived features

Code here is **not wired into the running app**. It was removed so Resume Redox can deploy cleanly on Vercel (serverless) with core edit / preview / print only.

## What’s archived

| Folder | Features |
|--------|----------|
| `features/ai/` | AI Coach UI, OpenAI API routes (roast, spell-check, recommend, tailor, suggest-name), job URL fetch, apply-recommendation helpers |
| `features/pdf-puppeteer/` | Server-side PDF via Puppeteer, export session cache on disk, `/api/export-pdf` |
| `features/server-file-persistence/` | `/api/resumes` writing `data/resumes.json` (local-only; broken on serverless) |

## How to turn features back on

### 1. AI Coach + tailor + job fetch

1. Move folders back to their original paths:

```bash
mv _archived/features/ai/components/ai components/
mv _archived/features/ai/lib/ai lib/
mv _archived/features/ai/lib/apply-recommendation.ts lib/
mv _archived/features/ai/lib/suggest-resume-name.ts lib/
mv _archived/features/ai/lib/job-description.ts lib/
mv _archived/features/ai/app/api/ai app/api/
mv _archived/features/ai/app/api/fetch-job app/api/
```

2. Restore UI wiring from git history (or this checklist):
   - `RightPanel`: Preview + AI Coach tabs
   - `ResumeSidebar`: “Tailor for role” action
   - `NewResumeDialog`: job context, fetch URL, AI name suggest, `createTailoredFromSource`
   - `JobDescriptionForm`: fetch URL + “Refine this resume in place”
   - `lib/store.ts`: AI recommendation + tailor methods
   - `lib/ui-store.ts`: coach tab + filters
   - Editor forms: `issueCount` / coach jump badges on `CollapsibleSection`

3. Set `OPENAI_API_KEY` in `.env.local` and in the Vercel project env vars.

4. Schema already keeps `aiRecommendations`, `aiMeta`, and `jobDescription` so stored resumes stay compatible.

### 2. Puppeteer Save PDF

1. Move:

```bash
mv _archived/features/pdf-puppeteer/app/api/export-pdf app/api/
mv _archived/features/pdf-puppeteer/lib/export-pdf-server.ts lib/
mv _archived/features/pdf-puppeteer/lib/export-cache.ts lib/
mkdir -p scripts && mv _archived/features/pdf-puppeteer/scripts/generate-pdf.mjs scripts/
```

2. Re-add `puppeteer` (and `serverExternalPackages` in `next.config.ts`).
3. On Vercel you will need a serverless Chromium package (e.g. `@sparticuz/chromium`) — the archived local Puppeteer path will not work as-is on Hobby/Pro serverless functions.
4. Wire `saveResumeAsPdf` in `lib/export.ts` back to `POST /api/export-pdf`.

### 3. Server file persistence

Only useful for local `npm run dev` with a writable `data/` folder. On Vercel, prefer localStorage + Backup/Import JSON (already in the toolbar).

```bash
mv _archived/features/server-file-persistence/app/api/resumes app/api/
```

Then restore `StoreHydration` file sync from git history.

## Current production path (Vercel-safe)

- Persistence: browser **localStorage** + optional **Backup/Import JSON**
- Export: **Print** (browser print → Save as PDF) via client-side session in `localStorage`
- No OpenAI key required
