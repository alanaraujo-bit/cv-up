# ADR 0003 — Resume content stored as a validated JSON document

**Status:** accepted (phase 0, implemented in phase 1)

## Context

The original specification listed a `ResumeSection` table. The editor autosaves
every few hundred milliseconds, supports arbitrary section reordering and
visibility, custom sections, and full version snapshots.

## Decision

`Resume.content` is a `JSONB` column holding a `ResumeDocument` — sections,
their order, visibility, titles and items — validated by a Zod schema at every
write. There is no `ResumeSection` table. `ResumeVersion` stores an immutable
copy of the same document.

`ClientResume` (a many-to-many join) is likewise dropped: a resume belongs to
at most one client, so `Resume.clientId` is a nullable foreign key.

## Rationale

- Autosave writes one row instead of N rows in a transaction.
- Versioning is an exact snapshot, not a reconstruction from joins.
- Adding a section type needs no migration.
- Diffing versions and sending the document to an AI model operate on a single
  object.
- JSONB with a GIN index still supports search across resume content.

## Consequences

- Referential integrity of the content is guaranteed by Zod, not by Postgres.
  This is only safe because there is exactly one validated write path
  (see `docs/architecture.md`).
- Schema changes to `ResumeDocument` need an explicit, versioned migration of
  stored documents. The document carries a `schemaVersion` field for this.
