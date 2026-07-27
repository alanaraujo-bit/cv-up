# ADR 0008 — The PDF renderer pulls work; the app never pushes

**Status:** accepted (phase 5)

## Context

ADR 0002 established that PDF export runs in a separate Playwright service.
That leaves how the two halves talk. Export is asynchronous either way — a real
browser has to open the résumé and print it, and a Vercel function must not sit
and wait for that.

Two shapes were considered.

**Push.** The server action creates an `ExportHistory` row and calls the
renderer's HTTP endpoint; the renderer acknowledges, renders in the background,
and calls back. This needs the renderer to have a public URL, the app to hold
that URL, and inbound authentication in both directions. Worse, a renderer that
dies between the acknowledgement and the callback leaves a row nobody will ever
touch again: the message is gone.

**Pull.** The renderer polls the app for work.

## Decision

Pull. `ExportHistory` is the queue. The renderer loops:

```
POST /api/render/claim      -> 204, or { exportId, renderUrl }
open renderUrl, print
POST /api/render/complete   -> the PDF bytes, or an x-export-error header
```

A claim is a conditional update on the row's `attempts` counter, so two
renderers polling simultaneously cannot take the same job — the loser matches
zero rows. A row left in `PROCESSING` past `STALE_RENDER_MS` becomes claimable
again, which is what turns a killed worker into a retry instead of a hang.

## Rationale

- **No message to lose.** Every state lives in a row that is already durable,
  already backed up, and already the thing the UI polls.
- **No inbound URL.** The renderer needs outbound HTTPS and nothing else, so it
  can run on Railway, on a laptop pointed at production, or on both at once.
- **The renderer holds almost no authority.** No database credentials, no blob
  token: one shared secret, and short-lived per-export render tokens issued by
  the claim it just won. Compare the push design, where the renderer would need
  storage access to put the file somewhere.
- **Retry is free.** `failExport` puts the row back to `PENDING` while attempts
  remain; the next poll picks it up. There is no separate retry mechanism to
  write or to reason about.
- Scaling is replicas. Claims being atomic is the only thing that makes that
  safe, and it is one `where` clause.

## Consequences

- A job waits up to `IDLE_POLL_MS` (5s) before anyone notices it. For a
  document a user is about to email to a client, that is not a cost worth
  optimising away with a message broker.
- The app exposes two endpoints that authenticate a machine rather than a
  person. They return 404 — not 401 — when the secret is absent or wrong, so an
  unconfigured deployment reveals nothing about what it is missing.
- `RENDER_WORKER_SECRET` is optional. Without it those endpoints do not exist
  and the export button is not rendered: an unconfigured deployment has no PDF
  export, rather than a broken one. This is the same treatment Google sign-in
  gets.
- Polling the queue costs one indexed query every five seconds per replica.
  `@@index([status, requestedAt])` exists for exactly that query.
