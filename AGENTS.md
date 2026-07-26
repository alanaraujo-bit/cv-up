<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# CV UP — working conventions

Read `docs/architecture.md` before adding anything structural, and
`docs/roadmap.md` to see which phase is in progress. Architectural decisions
live in `docs/decisions/` — add an ADR rather than silently diverging.

## Language

- **User-visible strings, routes and generated documents: Brazilian Portuguese.**
  Routes are Portuguese too (`/painel`, `/curriculos`, `/clientes`).
- **Code, identifiers, types, comments and docs: English.**

## Structure

- Features are vertical slices under `src/features/<feature>/`
  (`actions`, `components`, `hooks`, `schemas`, `services`, `types`).
  Do not add horizontal `src/services/` or `src/hooks/` catch-alls.
- `src/components/ui/` is shadcn-generated; treat it as owned code but keep
  edits minimal so upstream updates stay mergeable.
- Shared design tokens live in `src/app/globals.css`. Never hardcode a colour
  in a component — extend the token layer.

## Rules that are enforced

- `process.env` is banned outside `src/lib/env.ts`, config files and scripts
  (ESLint `no-restricted-properties`). Import `env` instead.
- TypeScript runs with `noUncheckedIndexedAccess`; array access is
  `T | undefined`. Handle it, don't cast it away.
- Every Prisma query must be scoped to the owning user. Go through the guards
  in `src/server/`, never `findUnique({ where: { id } })` on user data.
- `pnpm verify` (typecheck + lint + format + test) must pass before a commit.

## Product rule

No dead UI. A control that is rendered must do something. If a feature is not
built yet, do not render its button.
