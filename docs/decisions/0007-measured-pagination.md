# ADR 0007 — Pagination by measuring one flow, not by laying out pages

**Status:** accepted (phase 4)

## Context

ADR 0002 settled that the preview and the PDF are the same React component,
printed by the same browser engine. That leaves the question the preview
actually has to answer on screen: **where do the pages break?**

The preview is not allowed to guess. If the editor shows an experience entry at
the top of page 2 and the exported PDF puts it at the bottom of page 1, the
preview has failed at its only job — and the user only finds out after sending
the file to a client.

Three options were considered:

1. **Estimate from the content** — count lines, multiply by leading. Wrong the
   moment a line wraps differently, a name is long, or a font falls back.
2. **CSS fragmentation** (`columns`, or a paged-media polyfill). Chromium's
   implementation of fragmentation inside a scrolling container is
   inconsistent, and a polyfill re-implements the layout engine in JavaScript —
   the exact thing option 1 gets wrong, only slower.
3. **Lay the document out once and measure it.**

## Decision

Option 3. The whole résumé is laid out as a single continuous flow. Every
element that must not be split carries `data-block`. The browser is then asked
where those blocks actually landed, and `computePageOffsets` walks the measured
boxes to pick offsets where no block straddles a page edge.

Each sheet on screen holds a copy of that same flow, translated so that its own
slice shows through a clipped window. A page break is therefore one number, not
a re-layout.

Printing collapses the sheets back into one flow and lets Chromium paginate it
against `break-inside: avoid` on the same `data-block` elements.

## Rationale

- Line breaking, hyphenation and font fallback stay the browser's job, and the
  PDF renderer is the same browser. What is measured is what will print.
- The rule the preview enforces and the rule print enforces are the same rule,
  expressed once, keyed off the same attribute.
- `computePageOffsets` is a pure function over boxes, so the interesting
  behaviour — a block taller than a sheet, two columns crossing the same edge —
  is unit-tested without a DOM.
- Zoom is a CSS transform, which cannot change layout, so the pagination shown
  at 40% is the pagination at 100%.

## Consequences

- Measurement runs on a `ResizeObserver` and again after `document.fonts.ready`;
  web fonts land after first paint and move everything.
- The result is compared before it is stored, otherwise the observer feeds its
  own re-render back to itself.
- Sheets after the first duplicate the document in the DOM. They are
  `aria-hidden`, so a screen reader reads the résumé exactly once.
- Vertical page margin is a constant (13mm) rather than a per-template value:
  only `@page` margins repeat on every printed sheet, and Chromium will not
  resolve a custom property inside `@page`. Horizontal margin rides with the
  flow, where padding does repeat, and templates vary that instead.
