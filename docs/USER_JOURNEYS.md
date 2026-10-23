# Resume Redox — User Journeys

**Status:** Living doc · v2.0 (2026-10-16) — consumer-ready redesign
**Promise to the user:** build, design, and download a great resume for free. No paywall at the finish line, no watermark, no account required. The only paid tier is **Redox Pro** ($5/mo or $48/yr) for AI features — see [MONETIZATION.md](MONETIZATION.md).

The bar for every journey: **a first-time visitor understands the benefit and sees their own resume taking shape within 60 seconds.**

---

## 1. Map

```mermaid
flowchart TD
    L["/ Landing<br/>value prop · comparison · pricing · FAQ"] -->|Build my resume| H
    L -->|Import my old resume| IMP
    H["/app Home<br/>first-run welcome or My resumes"] -->|Import my resume| IMP["Import dialog<br/>upload → review → open"]
    H -->|Start from scratch / New resume| G["Template gallery<br/>live thumbnails"]
    H -->|Explore the sample| E
    H -->|Open a resume card| E
    H -->|⋯ Tailor a copy for a job| JM
    G -->|Pick a template| E["Editor<br/>Content · Design · Job match + live preview"]
    IMP --> E
    E --> C["Content tab"]
    E --> D["Design tab"]
    E --> JM["Job match tab<br/>free keyword check · AI teaser"]
    E -->|Download| DL{"PDF · Word · TXT · Print"}
    DL -->|PDF service OK| PDF["Text PDF downloaded"]
    DL -->|PDF service unavailable| PV["Print view → Save as PDF"]
    E -->|My resumes| H
    H -.->|Sync (optional)| S["Sign-in dialog"]
    E -.->|Sync (optional)| S
```

Surfaces:

| Surface | Route / state | Purpose |
|---|---|---|
| Landing | `/` (static) | Explain the value in one screen; send people to the builder |
| Home | `/app`, `appSurface = "home"` | First-run "how do you want to start?" + the **My resumes** grid |
| Template gallery | `/app`, `appSurface = "gallery"` | Pick a look for a **new** resume |
| Editor | `/app`, `appSurface = "editor"` | Edit one resume: Content · Design · Job match, live preview |
| Print view | `/export/preview?token=…` | Browser print / Save-as-PDF of the exact template |
| Password reset | `/auth/action` | Firebase email action handler |

Deep links: `/app?start=import` opens the import dialog, `/app?start=new` opens the gallery.

---

## 2. Journeys

Each journey lists the path, what "done" looks like, and — where the old app was confusing — what changed.

### J1 · First visit → value in under a minute
**Who:** someone who clicked a shared link.
**Path:** `/` → **Build my resume — free** → Home welcome → one of three cards:
1. **Import my resume** (primary, dark card) → J2
2. **Start from scratch** → J3
3. **Explore the sample** → editor on the sample, with a banner offering *Import my resume* / *Start from scratch*

**Done when:** they are typing into their own resume with the preview updating.

**Was confusing → fixed**
- The whole app sat behind a **sign-in wall**; with no Firebase config it showed "Sign-in isn't configured yet" and nothing else. → **Removed.** The builder works instantly, locally. An account is optional and only adds sync (J9).
- There was **no landing page** explaining why this beats other builders. → New `/` with the "doesn't charge you at the finish line" promise, comparison table, pricing, FAQ.
- Cold users landed on a template wall with **placeholder tiles labeled `needs-real-thumb` / "Coming in GF7"** and chips for unfinished features. → Real, live-rendered thumbnails only; no internal jargon anywhere in the UI.

### J2 · Import an existing resume (fastest path)
**Path:** Home → **Import my resume** (or drop a PDF/DOCX anywhere on Home, or `/app?start=import`) → choose file → **Check what we found** (every field editable, filled/partial/empty badges) → **Looks good — open it** → editor.

**Done when:** a new resume containing their content is open in the editor, with a toast reminding them to give it a quick read.

**Rules**
- From Home / gallery / landing, an import **always creates a new resume** — nothing existing is touched.
- From inside the editor ("Have an old resume? Import"): if the open resume is empty it is filled in place; if it has content the user chooses *Save as a new resume* (default) or *Replace the open resume* (requires an explicit tick).
- The built-in sample is never overwritten by an import.

**Was confusing → fixed**
- Imports from the front door compared against whichever resume happened to be active (often the demo) and asked "add vs replace" about a resume the user never chose. → Target is now explicit (`importTarget: "new" | "auto"`).
- Copy like "Apply", "Version name", "Extract complete", "sidebar version" → plain language ("Looks good — open it", "Name this resume", "Read successfully").

### J3 · Start from scratch
**Path:** Home → **New resume** / **Start from scratch** → gallery (**Pick a starting look**, live thumbnails of every template with sample content) → click a template → editor, Content tab.

- If the user already has a resume, **"Reuse my contact info from …"** is pre-checked so a second role-specific resume doesn't mean retyping name/email/phone.
- An empty resume shows a friendly overlay in the preview ("Your resume builds itself here") and an *Import* shortcut at the top of the form.

**Was confusing → fixed**
- "New resume" previously opened the gallery in one of **two modes** (`create` vs `change-design`) with a different headline, a "Blank" tile that meant different things per mode, and a header button whose label depended on hidden state. → The gallery now does exactly one thing: start a new resume. Changing the look of an existing resume lives in the Design tab (J5).

### J4 · Write and edit content
**Path:** Editor → **Content** tab.

- Sections appear **in the same order as on the page** (follows Design → Section order).
- Each section shows a ✓ when it has content and a one-line "what good looks like" tip.
- Jobs, degrees, projects are **collapsible cards** summarised as "Title · Company · dates"; move up/down and a two-step *Remove* live inside the card.
- **Bullet editor:** Enter = new bullet, Backspace on an empty bullet removes it, pasting a list splits it into bullets.
- **Add a section:** one-tap Projects / Certifications / Volunteering / Leadership / Awards / Custom.
- Every edit autosaves; the top bar shows *Saving… → Saved on this device* (or *Saved & synced*).
- The resume name is editable inline in the top bar; untitled resumes display as "‹Full name› — Resume".

**Was confusing → fixed**
- Every bullet carried its own ↑ ↓ ✕ buttons; every entry was labeled "Job 1 / Entry 2". → Clean bullet list, summaries instead of numbers.
- "Target Role Notes" sat at the top of the content form with no clear purpose. → Moved to the **Job match** tab where it powers the keyword check.

### J5 · Change the design
**Path:** Editor → **Design** tab (or the *Template · Change* link above the preview).

- **Template:** grid of live thumbnails rendered with *the user's own content* (sample content until they've written a summary/experience).
- **Typography & spacing:** font buttons rendered in their own typeface; size and spacing as segmented controls, with the tip "Spilling onto page 2? Try Compact or Tight first."
- **Color:** swatches + custom hex on the Accent template; other templates explain they're monochrome and offer *Switch to Accent Clean*.
- **Section order:** drag or arrows; Contact pinned.
- **Fine-tune:** contact layout (one line / labeled), heading case, "Summary" vs "Profile" (these existed in the data model but had no UI).

**Was confusing → fixed**
- Three different ways to change templates (gallery "change design" mode, a chip strip above the preview, and a button in the Design panel), and the Design panel replaced the preview so you couldn't see your change. → One place (Design tab), preview always visible beside it on desktop.
- Accent color controls were shown on every template but only worked on one. → Shown only where they work.

### J6 · Tailor a resume for a specific job
**Path A:** Home → resume card **⋯ → Tailor a copy for a job** → editor opens on **Job match** with a copy named "… — tailored".
**Path B:** Editor → **Job match** tab on any resume.

- Paste the posting → free **Keyword check**: "13 of 20 key terms appear on your resume", a coverage bar, *Missing* chips (tap to add to Skills, with a "keep it only if it's true" reminder) and *Already on your resume* chips. Deterministic, runs locally; no AI.
- Below it, **AI tools for this job (Pro)**: a locked AI match score, *Score & tailor my resume*, and *Email me jobs like this* — each opens the upgrade dialog (J13).

**Was confusing → fixed**
- "From a job" opened a sheet whose only button was a disabled **"Continue (GF5)"**. → Replaced by a working, free keyword check plus an honest "coming soon" card.

### J7 · Download / print
**Path:** Editor → **Download** (orange, top-right) →
- **PDF — Best:** server-rendered Chromium PDF of the exact template (selectable text, embedded fonts, US Letter).
- **Word (.docx):** simple parser-friendly layout for portals that want Word.
- **Plain text (.txt):** for pasting into forms.
- **Print.**

File name = the resume's name, or `First_Last_Resume` while untitled. No account needed for any format.

**PDF without an account:** the client asks Firebase for a silent **anonymous guest token** so the server keeps its auth + per-user rate limits. If that isn't possible (Firebase not configured, anonymous auth disabled, rate-limited, server busy), the user gets **"Save your PDF from the print view"** with three numbered steps — never a dead end.

**Was confusing / broken → fixed**
- PDF required signing in (and the app required signing in to see anything). → Free for everyone, with graceful fallback.
- **Print always reported "Pop-up blocked"** even when the tab opened: `window.open(…, "noopener")` returns `null` by spec. → Fixed.
- **The print view went blank ("Missing export token")** right before printing: it strips `?token=` from the URL, and Next 15 syncs `useSearchParams` with `history.replaceState`. → Params are now read once.
- Download and Print were separate, unrelated buttons with an "Import" button between them. → One Download menu; import lives where you start resumes.

### J8 · Manage resumes
**Path:** Editor → **My resumes** (top-left) → Home grid of live thumbnails (most recent first).

Per card **⋯**: Rename · Duplicate · Tailor a copy for a job · Download backup (.json) · Delete (confirmation dialog; disabled for the last resume).
Header **archive icon**: *Back up all resumes* (one .json) · *Restore from backup* (adds; never overwrites).

**Was confusing → fixed**
- A permanently-visible dark sidebar on desktop (a third column) with hover-only Rename/Delete and a native `confirm()`. → Dashboard with clear actions and proper dialogs; the editor gets the full width.
- JSON restore offered "replace current resume" against whatever was active. → Restore only adds.

### J9 · Sync across devices (optional)
**Path:** **Sync** (cloud icon) in Home or editor header → dialog: Google or email; explains it's optional and what it adds. Signed in → avatar with a status dot; menu shows sync status and *Sign out (resumes stay on this device)*.

If both the account and this device have different resumes, a **"Which resumes should we keep?"** dialog shows the counts on each side and says plainly that the other set is overwritten.

Anonymous guest sessions (J7) are invisible: they never show as "signed in" and never sync.

### J10 · Returning user
- Landing CTA reads **Continue to my resumes**.
- `/app` reopens the editor if that's where they left off, otherwise Home. (The gallery is never a cold landing spot.)

### J11 · Phone
- Home: full-width cards, a floating **New resume** button within thumb reach.
- Editor: bottom navigation **Content · Design · Job · Preview**; Download and Sync collapse to icons in the top bar; the preview scales the letter page to the screen while PDF stays full size.
- Dialogs become bottom sheets. Inputs are 16px so iOS doesn't zoom on focus.

### J14 · See how an ATS reads my resume (free)
**Path:** Editor → **ATS check** tab (desktop tab bar / phone bottom nav "ATS").

- The resume's plain-text layer (identical to the PDF/Word downloads) is run back through the resume parser used for imports.
- **Header:** "N of M checks passed" bar, or "Clean parse" when everything lands.
- **What to fix:** issues ranked Fix → Improve → Tip, each with a *Go* button that jumps to the right section. Examples: missing or unreadable email, jobs the parser lost, missing start dates, mixed date formats, no bullets, emoji, unusual headings.
- **What it found:** contact fields (with "your resume says …" when the parse differs), work history (title · company · location · dates · bullet count), education, skills.
- **Raw text an ATS receives**, collapsible.
- **Fix these with AI · Pro** → upgrade dialog (`atsfix`).
- Honest footnote: a simulation of common parsing rules; real systems vary.

### J13 · Discover and join Redox Pro
**Entry points:** landing (nav *Pro*, the Pro section, Pricing), Home (✨ Pro, *Turn on job alerts*), editor (*Check spelling & grammar*, ✨ on a bullet, *Enhance bullets*, Job match *Score & tailor* / *Email me jobs like this*).
**Entry point added:** ATS check → *Fix these with AI*.
**Path:** tap any of them → **upgrade dialog** leading with that feature → monthly/yearly toggle ($5/mo · $48/yr) → email → **Join the waitlist** → "You're on the list."

- Pro features are always visible but clearly marked **Pro**; tapping one never loses work or navigates away.
- Every Pro surface restates that the builder and downloads stay free.
- Signed-in users get their email prefilled. A browser that already joined sees the confirmed state.
- If the signup can't be saved (Firebase missing or rule not deployed) the user sees an honest error, never a fake success.

### J12 · Forgot password
Sign-in dialog → *Forgot password?* (needs the email typed first) → email link → `/auth/action` → set new password → back to `/app`.

---

## 3. Verifying the journeys

`scripts/e2e-journeys.mjs` drives J1–J8 in a real browser (deep-link import with a fixture PDF, bullet editing, DOCX/TXT downloads, PDF fallback + print view, job match, design switch, duplicate/rename/delete, reload persistence) and fails on any console error.

```bash
npm run build && npm start      # in one terminal
npm run test:journeys           # in another (BASE_URL=… to target a deployment)
```

## 4. Open items

| Item | Why it matters |
|---|---|
| **Enable Anonymous sign-in** in Firebase Console → Authentication → Sign-in method | Lets signed-out users get the server PDF. Without it they still get PDFs via the print view. |
| Social preview image (`app/opengraph-image`) | Shared links currently show text-only cards. |
| Privacy-friendly analytics on J1–J7 funnel steps | To measure the 60-second goal instead of guessing. |
| More templates (PRD T1: 12–20) | Gallery has 6 real ones; no placeholders are shown. |
| Redox Pro billing + AI | Marketing, entry points, and waitlist are live; billing and the AI features themselves are not. Checklist in [MONETIZATION.md](MONETIZATION.md). |
| Deploy the `proWaitlist` Firestore rule | Required for waitlist signups to save. |
