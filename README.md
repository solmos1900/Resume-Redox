# Resume Redox

A local-first resume builder with live ATS-friendly preview, ChatGPT-style resume sidebar, AI Coach, and role-specific versions saved in your browser.

## Features

- **Live preview** — edit in the center, see the resume update instantly
- **Resume sidebar** — collapsible list of all resumes (like ChatGPT conversations)
- **AI Coach tab** — roast, spell check, recommendations, and job tailoring in one panel
- **Independent Save & Print** — Save downloads a PDF; Print opens the print dialog. Both use filename `{Resume Name} - {Your Name}`
- **Job description tailoring** — pick any existing resume as source, paste a JD, create tailored copy or adjust current
- **Grouped skills** — organize skills by category
- **No account required** — all data persists in localStorage

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### AI features (OpenAI)

Copy `.env.example` to `.env.local` and add your OpenAI API key:

```bash
cp .env.example .env.local
# Add OPENAI_API_KEY=sk-...
```

Restart the dev server after adding the key. Without it, tailoring falls back to keyword-based skill reordering; roast, spell check, and recommendations require the key.

## Creating & tailoring resumes

### New resume (sidebar → + New resume)
1. Choose **Blank** or **From existing resume**
2. Optionally check **Add target role context** and paste/fetch a job description
3. Resume name is **auto-suggested** from the job (like ChatGPT conversation titles) — edit before creating
4. With job context + existing source → creates an AI-tailored copy

### Tailor for role (sidebar → hover resume → Tailor for role)
Creates a new resume tailored to a job posting from the selected source. Name is auto-suggested from the JD.

### Target Role Context (editor)
Stores the job description for the **current** resume. Used by AI Recommendations and optional **Refine this resume in place**.

## AI Coach workflow

1. Select a resume from the sidebar
2. Switch to the **AI Coach** tab (right panel)
3. Run **Roast**, **Spell Check**, or **Recommendations**
4. Tailor cards appear here after using **Tailor for role** from the sidebar
5. Use **Apply Fix**, **Jump to Field**, or **Dismiss** on each card
6. Switch to **Preview** tab → **Save PDF** or **Print**

## Role-tailoring workflow

1. Hover an existing resume → **Tailor for role**, or **+ New resume** with job context
2. Paste job description → name auto-fills (e.g. "Product Manager @ Acme")
3. Edit name if needed → **Create tailored resume**
4. Fine-tune in editor; run AI Coach for feedback
5. **Save PDF** or **Print**

## Save vs Print

| Button | Action |
|--------|--------|
| **Save PDF** | Downloads a PDF file directly |
| **Print** | Opens browser print dialog (use "Save as PDF" there) |

Both prefill the filename as `{resume version name} - {full name}`.

## Resume templates

Five ATS-safe templates — switch in the **Preview** tab. Each resume version remembers its template.

| Template | Best for |
|----------|----------|
| **Classic ATS** | Default; traditional underlined sections |
| **Modern Clean** | Minimal, spacious layout |
| **Compact Professional** | Long experience histories |
| **Executive Formal** | Senior roles; centered header |
| **Clear Structure** | Strong section labels for scanning |

All templates use single-column layout, semantic HTML, system fonts, and no tables/images — optimized for applicant tracking systems.

## ATS formatting notes

- Semantic HTML, system fonts, single column
- No tables, columns, images, or icons in the resume output
- Skills as `Category: item, item, item` lines
