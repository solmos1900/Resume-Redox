# Resume Redox — Product Requirements Document (PRD)

**Owner:** Product Manager — Stefan  
**Status:** Living doc (v1.0 — 2026-09-08)  
**Repo:** https://github.com/solmos1900/Resume-Redox  
**Live:** https://resume-redox.vercel.app  
**North-star product:** [FlowCV](https://app.flowcv.com/) / [flowcv.com](https://flowcv.com/)  
**North-star PDF quality:** FlowCV export (real text PDF, embedded fonts, US Letter, selectable, tagged — not a page screenshot)

---

## 1. End goal

Ship a resume builder that **feels and exports at FlowCV quality**, while winning on a clearer job:

> **Role-specific, ATS-safe resumes with WYSIWYG text PDFs — unlimited versions, local-first, no watermark theater.**

“FlowCV level” means:

| Dimension | Bar |
|-----------|-----|
| **Editor UX** | Choose a design → edit with live preview → design knobs (fonts, color, spacing, section order) |
| **Onboarding** | Start blank **or** import an existing resume (PDF/DOCX) |
| **Export** | PDF matches on-screen template; selectable text; letter; no chrome. Word/TXT = ATS text siblings |
| **Templates** | Enough polished ATS-safe options to feel like a gallery (not 50 creative two-column looks) |
| **Trust** | What you see is what you get; QA gates merges |

We **do not** copy FlowCV’s whole career suite (job tracker, personal website, email signature) in v1.

---

## 2. Problem

Job seekers need multiple tailored resumes (TPM vs SWE vs “relationship-focused”). FlowCV’s free tier locks you to **one** resume and monetizes versions. Most builders either:

- Look great but fail ATS / export as images, or  
- Are ATS-safe but look cheap and don’t match PDF to preview.

Resume Redox already has multi-version + ATS templates. Gaps vs FlowCV were: **export fidelity** (done), then **design control**, **import**, and **gallery-first create**.

---

## 3. Product principles

1. **WYSIWYG PDF** — same React templates as preview → Chromium/Skia text PDF (shipped in PR #15).  
2. **ATS-first layouts** — single column; standard headings; semantic lists; skills stay single-column unless parse order is proven.  
3. **Unlimited role versions** — free forever advantage vs FlowCV free.  
4. **Local-first** — localStorage + JSON backup; account/Firebase optional later.  
5. **Honest formats** — PDF = visual deliverable; Word/TXT = labeled ATS text siblings (content/order parity, not Accent twin).  
6. **Team gate** — Stefan product; Bobby eng; Amadeus design; Gregor QA approve only when it *functions* as expected.

---

## 4. Current baseline (shipped)

| Capability | Status |
|------------|--------|
| Live three-pane editor + mobile tabs | Shipped |
| Multi-resume sidebar / versions | Shipped |
| 6 ATS templates (Classic → Accent) | Shipped |
| Custom sections (Projects, etc.) | Shipped |
| JSON backup / import | Shipped |
| **PDF = Chromium text, same templates as preview** | **Shipped (PR #15)** |
| DOCX / TXT same section order as preview | Shipped (PR #15) |
| Firebase auth / cloud sync in tree | Partial / optional |
| AI Coach, job-URL fetch | Archived |

---

## 5. Competitive reference (FlowCV)

### FlowCV free (what “level” means for UX)

- 50+ templates + full design customization  
- Import existing resume (PDF/DOCX/PNG/JPG; free includes limited imports)  
- Unlimited watermark-free PDF downloads  
- Live preview editor  
- **Limit:** 1 saved resume (+ 1 cover letter)

### FlowCV paid (context, not v1 copy list)

- Unlimited resumes / cover letters  
- Job application tracker  
- AI writing assistance  
- Online resume / custom domain (higher tiers)

### Resume Redox vs FlowCV (strategy)

| | FlowCV free | Resume Redox target |
|--|-------------|---------------------|
| Versions | 1 | Unlimited (already) |
| PDF quality | Excellent text PDF | Match quality (done path; keep) |
| Design knobs | Full | **Must ship** |
| Import | PDF/DOCX | **Must ship** |
| Template count | 50+ (many decorative) | **12–20 ATS-safe**, gallery UX |
| Cover letter | Yes | Later |
| Job tracker / site | Paid extras | Out of v1 |
| ATS honesty | Mixed (multi-column skills) | Prefer single-column |

References: [FlowCV](https://flowcv.com/), [Pricing](https://flowcv.com/pricing), [App](https://app.flowcv.com/), WIRED “Best Free Résumé Builder” mentions in 2026 reviews (e.g. ResuFit / ResumeHog roundups).

---

## 6. Goals & non-goals

### Goals (v1 FlowCV-parity)

1. **Design controls** — font family/size, accent color, spacing density, drag section order; live preview + PDF stay in sync.  
2. **Import resume** — PDF and DOCX → prefilled sections; user edits after.  
3. **Template gallery on create** — visual cards (FlowCV “choose a design” moment); still ATS-only templates.  
4. Grow template set to **~12–20** single-column ATS layouts (not creative two-column spam).  
5. Keep export fidelity under Gregor’s bar after every visual change.

### Non-goals (v1)

- Job tracker, personal website, email signatures  
- Decorative multi-column / image-heavy templates that break ATS  
- Paying for Nutritionix-style “content APIs” — N/A; for AI: restore archived Coach only after privacy + cost call  
- Matching FlowCV’s 50+ template *count* for its own sake  
- html2canvas / image-PDF paths  

---

## 7. Personas & jobs-to-be-done

**Primary:** Active job seeker (SWE / PM / TPM) maintaining **several role versions**.  

Jobs:

1. Import my current resume and clean it in minutes.  
2. Duplicate a version, tweak bullets for a posting, export PDF that looks like the preview.  
3. Switch template / accent without rewriting content.  
4. Hand ATS a clean `.docx` when the portal wants Word.

---

## 8. Requirements

### P0 — Done

- [x] Text PDF via Chromium/Skia of same templates as preview  
- [x] DOCX/TXT content + section-order parity; honest labeling  
- [x] No Vercel/browser chrome on Download → PDF  
- [x] Gregor functional gate on production smoke  

### P1 — FlowCV-feel (next)

| ID | Requirement | Owner | Acceptance |
|----|-------------|-------|------------|
| **D1** | Design panel: font, accent color, spacing density | Bobby + Amadeus | Changing a control updates preview **and** PDF; Gregor proves Classic+Accent+one custom accent |
| **D2** | Drag-reorder sections (and entries where applicable) | Bobby + Amadeus | Order persists; PDF/DOCX follow same order |
| **I1** | Import PDF → structured fields | Bobby | Happy path: name, contact, experience bullets; user confirms before overwrite |
| **I2** | Import DOCX → structured fields | Bobby | Same as I1 |
| **G1** | Create flow: visual template gallery | Amadeus + Bobby | New resume starts with gallery; empty/blank still available |
| **T1** | Expand to 12–20 ATS templates | Amadeus + Bobby | Each has preview card + PDF spot-check |

### P2 — After parity

| ID | Requirement | Notes |
|----|-------------|-------|
| **C1** | Cover letter sibling doc | Match brand; export PDF |
| **S1** | Shareable online resume link | Needs auth/hosting; Khalil if GTM |
| **A1** | Re-enable AI Coach carefully | Archived; privacy + cost + Gregor |
| **M1** | Monetization (optional) | Redox already gives free multi-version — don’t copy FlowCV’s paywall on versions |

---

## 9. Game plan (phased)

### Phase 0 — Foundation *(complete)*

Export fidelity PR #15 on production. Team model locked.

### Phase 1 — Design controls *(next build)*

**Why first:** Biggest “this feels like FlowCV” gap once PDF works.  
**Ship:** D1 + D2 in one PR if possible.  
**Gate:** Amadeus visual LGTM; Gregor: preview ↔ PDF sync + selectable text still holds.

### Phase 2 — Import

**Why:** FlowCV’s onboarding win.  
**Ship:** I1 then I2 (or together if one parser pipeline).  
**Gate:** Gregor golden-file resumes; no silent data loss; user review step.

### Phase 3 — Gallery + more templates

**Why:** First-run emotion of FlowCV’s template wall without abandoning ATS.  
**Ship:** G1 + T1 (add templates in batches of 3–4).  
**Gate:** Amadeus cards; Gregor PDF per new template.

### Phase 4 — Stretch

Cover letter (C1), share link (S1), AI (A1) — only after P1–P3 feel solid.

### Cadence

1. Stefan writes issue with Why + acceptance.  
2. Amadeus specs copy/taps when UI.  
3. Bobby opens PR vs `main` (Vercel preview auto).  
4. Amadeus design review.  
5. **Gregor approves only if it functions** — no rubber stamps.  
6. Sebastian merge if agents hit GitHub 403.

---

## 10. Success metrics

| Signal | Target |
|--------|--------|
| PDF selectable + matches preview | 100% of shipped templates (Gregor) |
| Time to first useful export for a new user | < 10 min with import (Phase 2) |
| Role versions per active user | ≥ 2 (already our wedge vs FlowCV free) |
| Support complaints: “PDF ≠ screen” | Near zero after Phase 1 |

---

## 11. Risks

| Risk | Mitigation |
|------|------------|
| Serverless Chromium cold start / Hobby limits | Already on `@sparticuz/chromium-min`; watch timeouts; Pro if needed |
| Import quality (bad PDF parse) | Always show review UI; never silent overwrite |
| Design knobs break ATS | Constrain to safe fonts/colors; Amadeus + Gregor |
| Scope creep into FlowCV suite | Non-goals list; Khalil/Stefan push back |
| GitHub 403 for agent comments/merge | Sebastian merge; paste reviews via cloud agent when needed |

---

## 12. Open decisions (Sebastian)

1. Phase order: confirm **Design → Import → Gallery** (recommended) vs Import first.  
2. Cover letter in v1 or after? (Recommend **after**.)  
3. Should design controls be free forever? (Recommend **yes** — compete on value.)  

---

## 13. References

### Product / competitors

- FlowCV app: https://app.flowcv.com/  
- FlowCV marketing: https://flowcv.com/  
- FlowCV pricing: https://flowcv.com/pricing  
- FlowCV reviews (2026 free-tier / template context): ResuFit, ResumeHog, Teal roundups  

### Our product

- App: https://resume-redox.vercel.app  
- Repo: https://github.com/solmos1900/Resume-Redox  
- Export fidelity PR: https://github.com/solmos1900/Resume-Redox/pull/15  
- Archived AI restore: `_archived/README.md`  

### Quality bar

- Sebastian’s FlowCV PDF sample (2026-09-08): real text, Alegreya embedded, tagged, letter, selectable — **north star for PDF tier**  
- ATS: single-column, standard headings, semantic lists; avoid tables/images for structure  

### Team

| Role | Agent | Owns |
|------|-------|------|
| Product | Stefan | North star, PRD, priority, issues |
| Engineering | Bobby | PRs, Vercel-safe implementation |
| Design | Amadeus | Visual/export quality, gallery, copy/taps |
| QA | Gregor | Functional approve / block |
| GTM | Khalil | Hosting/store/GTM if needed later |

---

*End of PRD v1.0*
