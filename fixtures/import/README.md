# Phase 2 import golden fixtures (Gregor)

Text-extractable sample resumes for PDF/DOCX import acceptance. **Not image-only.**

| File | Format | Person | Happy-path checks |
|------|--------|--------|-------------------|
| `jordan-lee-pm.pdf` | PDF | Jordan Lee (PM) | name, email, experience bullets |
| `sam-chen-swe.pdf` | PDF | Sam Chen (SWE) | name, email, experience bullets |
| `morgan-patel-tpm.docx` | DOCX | Morgan Patel (TPM) | name, email, experience bullets |

Plain-text mirrors (`*.txt`) match the structured content for human review.

Regenerate:

```bash
node scripts/generate-import-fixtures.mjs
```

Acceptance parse check:

```bash
npm run test:import-fixtures
```
