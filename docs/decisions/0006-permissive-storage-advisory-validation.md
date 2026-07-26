# ADR 0006 — Permissive storage, advisory validation

**Status:** accepted (phase 3)

## Context

The editor autosaves roughly a second after the first unsaved change. The first
implementation validated the document with a strict Zod schema on the way in:
`company` was `min(1)`, an experience needed an end date unless marked current,
and so on.

That is unusable. A save firing while the user is halfway through typing a
company name would be rejected, and the work would sit unsaved until the whole
item happened to be valid.

## Decision

Two layers, with different jobs:

- **`schemas/document.ts` — what may be stored.** Every text field is trimmed
  and length-capped, and empty means "not filled in yet". Nothing is required.
  Structural invariants that would corrupt the document _are_ enforced: known
  section types, unique section ids, array caps.
- **`validation/advisories.ts` — what the resume still needs.** Pure functions
  over a document returning `required` and `suggested` issues, each pointing at
  a section and item. These drive the pendency counter on the editor header and
  on each section card, and from phase 5 they gate PDF export.

## Consequences

- A half-finished resume always saves. That is the point.
- "Required" now means "required to hand to a client", not "required to
  persist" — the honest meaning for this product.
- Guidance and storage evolve independently: tightening advice never risks
  rejecting documents already in the database.
- Advisories are computed on every document change. They are cheap pure
  functions over a small object, memoised in the editor.
- Hidden sections produce no advisories, since they will not be printed.
