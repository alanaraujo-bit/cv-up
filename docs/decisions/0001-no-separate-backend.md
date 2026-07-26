# ADR 0001 — No separate backend service

**Status:** accepted (phase 0)

## Context

The product needs authentication, CRUD over resumes and clients, file uploads
and, later, AI calls and billing. A dedicated backend (NestJS, Fastify) was
considered.

## Decision

All business logic runs inside the Next.js app: Server Actions for writes,
React Server Components for reads, route handlers for webhooks and uploads.

The single exception is PDF rendering (ADR 0002).

## Rationale

- One deploy, one set of types, no client/server contract to keep in sync.
- Server Actions already give validated, authenticated, colocated mutations.
- At the expected scale, a second service adds latency and operational cost
  without buying isolation we need.

## Consequences

- Business logic must stay framework-free inside `features/*/services` so it
  remains extractable if a real backend is ever justified.
- Long-running work cannot live in a request handler; it goes to a service or
  a queue (as PDF rendering does).
