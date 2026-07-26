# ADR 0005 — Production builds run on webpack, not Turbopack

**Status:** accepted (phase 0) — revisit when Serwist supports Turbopack

## Context

Next.js 16 enables Turbopack by default. `@serwist/next`, which builds the PWA
service worker, does so through a webpack plugin. Turbopack aborts the build
when a webpack config is present with no Turbopack config, and silently ignores
the plugin if that error is suppressed with `turbopack: {}` — which would ship
a PWA with no service worker.

Serwist's configurator mode (`@serwist/next/config` + `@serwist/cli`) does
support Turbopack, but it generates `public/sw.js` as a step _after_
`next build`. On Vercel the static output is collected from the build result,
so a file written to `public/` afterwards would not be deployed.

## Decision

- `pnpm dev` → `next dev` (Turbopack). The service worker is disabled in
  development anyway, since it would serve stale assets across reloads.
- `pnpm build` → `next build --webpack`, so the Serwist plugin runs.

`next.config.ts` exports a **phase function** and skips the Serwist wrapper
entirely when `phase === PHASE_DEVELOPMENT_SERVER`. Passing `disable: true` is
not sufficient: the wrapper injects a `webpack` key regardless, and Turbopack
refuses to start when it finds one. This was found only by running `pnpm dev`
— the production build passed throughout.

## Consequences

- Slower production builds than Turbopack would give. Acceptable: builds are
  not the inner loop, dev is.
- Dev and production use different bundlers, so bundler-specific breakage only
  surfaces at build time. CI runs a production build on every push for exactly
  this reason.
- Migrate to Turbopack once Serwist ships stable support
  (<https://github.com/serwist/serwist/issues/54>) — at which point this ADR is
  superseded and the `--webpack` flag is removed.
