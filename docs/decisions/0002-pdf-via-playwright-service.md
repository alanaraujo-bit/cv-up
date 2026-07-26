# ADR 0002 — PDF generation via a dedicated Playwright service

**Status:** accepted (phase 0, implemented in phase 5)

## Context

PDF export is the product's output. It must have correct page breaks, embedded
fonts, high resolution, and must look exactly like the editor preview.

Three options were evaluated:

1. **`@react-pdf/renderer`** — no browser needed, but every template has to be
   authored twice: once as HTML for the preview, once as react-pdf primitives
   for export. Divergence between the two is guaranteed over time.
2. **Chromium on Vercel serverless** (`@sparticuz/chromium`) — works, but cold
   starts of several seconds, bundle size limits, and awkward custom font
   handling.
3. **A dedicated Playwright service on Railway.**

## Decision

Option 3. A template is one React component. It is rendered in the editor for
the live preview and at `/render/[token]` for export; the Railway worker opens
that URL with Playwright, prints with `@page` and print CSS, and uploads the
result.

## Rationale

- One source of truth for template markup — the preview _is_ the PDF.
- Real control over pagination (`break-inside: avoid`, `orphans`, `widows`),
  margins and embedded fonts.
- Railway is already in the stack for Postgres, so the marginal cost is a
  Dockerfile.

## Consequences

- A second deployable to operate and monitor.
- `/render/[token]` must be authenticated with a short-lived, single-use signed
  token — it renders private resumes.
- Export is asynchronous: `ExportHistory` tracks status, with retry.
