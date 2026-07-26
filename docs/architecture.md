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

### Connecting to Postgres

Prisma 7 requires a driver adapter, so the client is built with `PrismaPg`
around `DATABASE_URL`. Two details of that URL are load-bearing:

- `connection_limit=1` — each serverless instance keeps a single connection, so
  a traffic spike cannot exhaust Postgres. `DIRECT_URL`, used by migrations and
  the seed, carries no such cap.
- `uselibpqcompat=true` — Railway terminates TLS with a self-signed
  certificate. Since pg 8.16, `sslmode=require` alone is treated as
  `verify-full` and the connection is rejected; this flag restores libpq
  semantics (encrypt, do not verify the chain).

## Authentication

Better Auth owns `User`, `Session`, `Account` and `Verification`; product data
lives in `Profile` so regenerating the auth schema never touches it. Ids come
from Prisma's `@default(cuid(2))` (`advanced.database.generateId: false`).

Route protection is two-layered:

1. `src/middleware.ts` — an _optimistic_ redirect that only checks whether a
   session cookie is present, so a signed-out visitor never sees the app shell
   flash. It reads the cookie by name rather than importing
   `better-auth/cookies`, which would pull `jose` into the Edge bundle.
2. `requireSession()` in the protected layout — the authoritative check.

`?proximo=` on the sign-in page passes through `safeRedirect()`, which rejects
anything not an internal path. An open redirect on a sign-in screen is a
phishing primitive.

## Environment

`process.env` is only read in `src/lib/env.ts`, which validates with Zod at
startup. A missing variable fails the build instead of a request in production.
ESLint enforces this.

`@/lib/env` is reachable from the browser bundle through the auth client, so
anything deriving a value from a **server** variable at module scope must live
behind `server-only` (see `src/server/auth-config.ts`) — evaluating it on the
client throws.

## App shell

`src/config/navigation.ts` is the single source for the sidebar, the mobile tab
bar and the ⌘K palette — adding a destination is one entry, not three edits.
`isNavItemActive` matches `/painel` exactly (otherwise every route lights it up)
and treats `${href}/` as a child, so `/clientes-antigos` never activates
`/clientes`.

Desktop gets a sticky sidebar; below `lg` it is replaced by a fixed tab bar
padded with `safe-bottom`, with a spacer in the layout so content is never
trapped behind it. This is deliberately not a hamburger drawer — a drawer reads
as a website on a phone.

The ⌘K palette is bound on `document` and ignores chords carrying Alt or Shift
so it never steals a browser shortcut. The displayed modifier comes from
`useSyncExternalStore` with a null server snapshot: the platform is unknowable
on the server, and this avoids both a hydration mismatch and a
setState-in-effect round trip.

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
