# ADR 0004 — Better Auth over Auth.js

**Status:** accepted (phase 0, implemented in phase 1)

## Context

The app needs email/password and social sign-in, database-backed sessions,
protected routes, and — later — organisations, roles and subscriptions.

## Decision

Better Auth, with the Prisma adapter.

## Rationale

- Database sessions and credentials sign-in are first-class rather than an
  escape hatch, which is where Auth.js v5 credentials flows get awkward.
- Official plugins for organisations, admin roles, 2FA and Stripe cover the
  phase 10 SaaS work without a rewrite.
- TypeScript-first API; the session type flows into server code directly.

## Alternative

Auth.js v5 — more widely documented and more conservative. It remains a viable
fallback; the auth surface is confined to `src/server/auth.ts` and the
`features/auth` slice specifically so this decision stays reversible.

## Consequences

- Smaller community than Auth.js; upgrades need reading release notes.
- Auth tables are owned by Better Auth's schema generator and must not be
  hand-edited in `schema.prisma`.
