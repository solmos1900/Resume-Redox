# Monetization — Free builder, paid AI (Redox Pro)

**Rule:** everything needed to build and download a resume is free forever. Only AI-powered features need a recurring subscription. Nothing free may ever move behind the paywall — the landing page promises this.

## Plans

| | Free | Redox Pro |
|---|---|---|
| Price | $0 forever | **$5/month** or **$48/year** (save 20%) — recurring |
| Unlimited resumes, all templates, design controls | ✅ | ✅ |
| PDF / Word / TXT downloads, no watermark | ✅ | ✅ |
| Import PDF/DOCX, optional sync | ✅ | ✅ |
| Keyword check vs. a job posting (deterministic, local, no AI) | ✅ | ✅ |
| **ATS check** — what a parser extracts from your resume + prioritized fix list (deterministic, unlimited) | ✅ | ✅ |
| **One-click ATS fixes** — AI rewrites the issues the ATS check flags | — | ✅ |
| **AI job match & tailoring** — match score against a posting + one-click tailored resume | — | ✅ |
| **Spelling & grammar check** — whole-resume pass with one-tap fixes | — | ✅ |
| **Bullet enhancer** — rewrite a bullet into a measurable accomplishment | — | ✅ |
| **Job alerts** — recurring email of roles matching your skills, each with a one-click tailored resume | — | ✅ |

Prices, names, and feature copy live in one place: [`lib/pro.ts`](../lib/pro.ts) (`PRO_PLAN`, `PRO_FEATURES`). Every surface reads from it.

## Where Pro is marketed

| Surface | Entry point | Opens |
|---|---|---|
| Landing `/` | Hero footnote, nav **Pro**, **Redox Pro** section (`#pro`), Pricing (Free vs Pro with monthly/yearly toggle + waitlist form), comparison row, FAQ | Waitlist form inline |
| Home | **✨ Pro** in header; **Job alerts** card under *My resumes* | Upgrade dialog (`alerts`) |
| Editor · Content | **Check spelling & grammar · Pro** bar (when the resume has content) | Upgrade dialog (`spellcheck`) |
| Editor · bullets | ✨ on each bullet (hover/focus) and **Enhance bullets · Pro** under each list | Upgrade dialog (`bullets`) |
| Editor · ATS check | Free parse view + fix list; **Fix these with AI · Pro** under the issues | Upgrade dialog (`atsfix`) |
| Editor · Job match | Free keyword check, then **AI tools for this job**: locked match score, *Score & tailor my resume*, *Email me jobs like this* | Upgrade dialog (`tailor` / `alerts`) |

The upgrade dialog leads with the feature the user tapped, lists the full plan, has the monthly/yearly toggle, and ends with "Everything else stays free, forever."

### Why the ATS check is free (and unlimited)

It's deterministic (no AI cost), it's the strongest proof that the free builder produces parser-safe resumes, and metering it ("2 free, then pay") would need forced accounts — a local counter is trivially reset — while contradicting the "free forever" promise. Pro monetizes the *fix*, not the diagnosis. If you ever want to meter it, gate `runAtsCheck` in `components/editor/AtsTab.tsx`.

## Until billing ships: the waitlist

`PRO_PLAN.launched = false`, so every CTA reads **Join the waitlist**. Signups are written to the Firestore collection **`proWaitlist`**:

```json
{ "email": "you@email.com", "billing": "yearly", "source": "bullets", "uid": "abc… | null", "createdAt": <server timestamp> }
```

`source` records which feature prompted the signup — use it to decide what to build first.

**Required Firestore rule** (add to your existing rules; create-only, no reads from clients):

```
match /proWaitlist/{id} {
  allow create: if request.resource.data.keys().hasOnly(['email', 'billing', 'source', 'uid', 'createdAt'])
    && request.resource.data.email is string
    && request.resource.data.email.size() < 255
    && request.resource.data.email.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')
    && request.resource.data.billing in ['monthly', 'yearly']
    && request.resource.data.createdAt == request.time;
  allow read, update, delete: if false;
}
```

Without the rule (or without Firebase config), the form shows "We couldn't save your spot right now" — it never pretends to succeed. Export the list from the Firebase console (or a one-off Admin SDK script) at launch.

## Launch checklist (when building billing)

1. **Stripe**: one Product, two recurring Prices ($5/mo, $48/yr). Checkout Session from a server route, customer portal for cancel/upgrade.
2. **Entitlements**: Stripe webhook → `entitlements/{uid}` = `{ plan: "pro", status, currentPeriodEnd }`; client reads it; AI API routes verify it server-side with the Firebase ID token (same pattern as `/api/export-pdf`). Pro requires an account (anonymous guests can't subscribe).
3. **AI routes**: restore from `_archived/features/ai` (tailor, spell-check, recommend) behind the entitlement check and per-user rate limits; suggestions always need user approval before applying.
4. **Job alerts**: scheduled job (e.g. Vercel Cron) → job source API → match against each subscriber's skills → email (Resend/Postmark) with deep links `/app?start=job&id=…` that create a tailored copy.
5. Flip `PRO_PLAN.launched = true` and swap the waitlist form for checkout; email the waitlist.
6. Update the privacy FAQ/policy: AI features send only the selected text to the AI provider.
