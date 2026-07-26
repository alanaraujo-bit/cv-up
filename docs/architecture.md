# Architecture

Written in English by convention (see `AGENTS.md`); everything the user sees is
in Brazilian Portuguese.

## System shape

```
                     ┌──────────────────────────────┐
  browser / PWA ────▶ │  Next.js app (Vercel)        │
                     │  RSC + Server Actions        │
                     │  route handlers, auth        │
                     └───────┬──────────────┬───────┘
                             │              │
                    Prisma   │              │ signed render URL
                             ▼              ▼
                  ┌────────────────┐   ┌──────────────────────┐
                  │ PostgreSQL     │   │ PDF renderer         │
                  │ (Railway)      │   │ Playwright (Railway) │
                  └────────────────┘   └──────────┬───────────┘
                                                   │ upload
                                                   ▼
                                            object storage
```

There is **no separate API backend**. Business logic runs inside the Next.js
app as Server Actions and route handlers; a dedicated service exists only for
PDF rendering, which needs a real browser (see ADR 0002).

## Code organisation

Vertical slices, not horizontal layers:

```
src/features/<feature>/
├─ actions/     server actions (the only write path)
├─ components/  UI owned by this feature
├─ hooks/
├─ schemas/     Zod schemas — the contract for every input
├─ services/    business logic, framework-free
└─ types/
```

Shared building blocks live outside features:

| Path                | Contains                                         |
| ------------------- | ------------------------------------------------ |
| `src/app/`          | routes, layouts, `manifest.ts`, `sw.ts`          |
| `src/components/ui` | shadcn/ui primitives                             |
| `src/components/`   | `brand/`, `providers/`, `shared/`, `layout/`     |
| `src/lib/`          | `env.ts`, `site.ts`, `utils.ts`, storage adapter |
| `src/server/`       | `db.ts`, `auth.ts`, guards, rate limiting        |
| `src/templates/`    | resume template engine (phase 4)                 |

## The write path

Every mutation follows the same sequence. No exceptions, because the ownership
check is what keeps one user's resumes away from another's.

```
component
  → server action
  → Zod validation
  → session + ownership guard
  → service (business logic)
  → Prisma, always filtered by userId
  → revalidate + typed result
```

`prisma.resume.findUnique({ where: { id } })` on user-owned data is a bug.
Use the guarded helpers in `src/server/`.

## Data model (phase 1)

Relational for identity and metadata; a validated JSON document for resume
content (ADR 0003).

| Entity                       | Notes                                            |
| ---------------------------- | ------------------------------------------------ |
| `User`, `Profile`, `Session` | Better Auth owns the auth tables                 |
| `Client`                     | CRM record; `ClientStatus` enum                  |
| `Resume`                     | metadata + `content` JSONB + nullable `clientId` |
| `ResumeVersion`              | immutable snapshot of `content`                  |
| `Template`                   | seeded catalogue; rendering resolved in code     |
| `ExportHistory`              | one row per PDF export                           |
| `AIAnalysis`                 | ATS score, suggestions, job matching             |
| `Subscription`               | dormant until phase 10                           |
| `AuditLog`                   | actor, entity, action, diff                      |

`Resume` and `Client` use soft deletes (`deletedAt`) — this user works with
other people's data and accidental deletion is unrecoverable otherwise.

Serverless functions exhaust Postgres connections quickly, so the app connects
through Railway's pooler with `connection_limit=1`.

## Environment

`process.env` is only read in `src/lib/env.ts`, which validates with Zod at
startup. A missing variable fails the build instead of a request in production.
ESLint enforces this.

## Design system

Tokens live in `src/app/globals.css`, authored in OKLCH so light and dark stay
perceptually matched. Components consume semantic tokens
(`bg-card`, `text-muted-foreground`, `border`), never raw colours.

Mobile behaviour is deliberate: no tap highlight, no rubber-band scroll, no
selection on chrome, 16px minimum font in fields (iOS zoom), safe-area
utilities (`safe-top`, `safe-bottom`, `safe-x`). Content the user authored opts
back into selection with `data-selectable`.

## Testing

- **Vitest + Testing Library** for units and components.
- **Playwright** for end-to-end once the editor exists (phase 3); the
  editor → PDF path is the flow that must never silently break.
- CI runs typecheck, lint, format check, tests and a production build on every
  push and pull request.
