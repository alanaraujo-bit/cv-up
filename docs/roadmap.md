# Roadmap

One phase at a time. A phase is done only when the build is clean, `pnpm verify`
passes, the deploy works, and the deliverable below can actually be exercised by
a person.

| Phase  | Scope                            | Status  |
| ------ | -------------------------------- | ------- |
| **0**  | Foundation and architecture      | ✅ done |
| **1**  | Database and authentication      | ✅ done |
| **2**  | App shell and dashboard          | ✅ done |
| **3**  | Resume builder (core)            | ✅ done |
| **4**  | Template engine and live preview | ✅ done |
| **5**  | PDF export                       | ✅ done |
| **6**  | Client management (CRM)          | ✅ done |
| **7**  | Version history                  | ⏳ next |
| **8**  | Remaining templates and polish   | —       |
| **9**  | AI features                      | —       |
| **10** | SaaS preparation                 | —       |

---

## Phase 0 — Foundation ✅

Next.js 16 + React 19 + TypeScript strict, Tailwind 4 with an OKLCH token
layer, shadcn/ui, light/dark themes, PWA (manifest, generated icon set,
Serwist service worker, offline route), validated environment, ESLint/Prettier,
Vitest, GitHub Actions CI.

**Deliverable:** installable app with working themes, deployed.

## Phase 1 — Database and authentication ✅

Prisma 7 with the full schema (13 models, 10 enums) on Railway Postgres, the
seven-template seed, Better Auth with email/password (Google ready but hidden
until credentials are configured), session helpers, an optimistic middleware
redirect plus the authoritative layout guard, `next-safe-action` as the single
write path, and the profile/settings screens.

**Deliverable:** sign up, sign in, edit profile. Verified end to end against a
production build: protected route redirects when signed out, sign-up issues a
session cookie, the dashboard renders real data, and a wrong password returns
`INVALID_EMAIL_OR_PASSWORD` mapped to a Portuguese message.

## Phase 2 — App shell and dashboard ✅

Sidebar on desktop, tab bar on mobile, safe areas, ⌘K command palette,
dashboard with real counts (resumes, drafts, completed, clients), the template
catalogue at `/modelos`, list pages for resumes and clients, empty states and
route-level loading skeletons.

Nothing on these screens is placeholder: every number and every card comes from
the database. The dashboard leads with the template catalogue rather than a
"recently edited" list, because resumes cannot exist until phase 3 and a list
that can only ever be empty is decoration. No sparklines either — a chart of
zeros is not information.

**Deliverable:** full navigation with metrics read from the database.

## Phase 3 — Resume builder (core) ✅

`ResumeDocument` schema with ten section types (objective, summary, experience,
education, skills, languages, certifications, projects, courses, custom),
autosave with a save indicator, drag-and-drop reordering of both sections and
the items inside them, undo/redo with coalescing, section visibility toggles,
renameable section headings, and photo upload.

The storage schema is **permissive by design** — see the note in
`schemas/document.ts`. Autosave fires while the user is mid-word, so a
"required" field at the storage layer would mean losing work. What a resume
still needs is computed separately by `validation/advisories.ts` and shown as a
pendency count, never as a save blocker.

**Deliverable:** create and edit a complete resume that persists.

## Phase 4 — Template engine and live preview ✅

A registry keyed by `Template.engineKey`, shared paper primitives, three
templates (Moderno, Executivo, Minimalista), instant template switching, print
CSS, and a preview with real A4 sheets, zoom and page breaks.

The preview does not estimate where pages break — it lays the document out once
and measures it, then breaks only between `[data-block]` elements, which is the
same rule `break-inside: avoid` enforces when printing (ADR 0007).

Switching templates is lossless because the document knows nothing about
templates: a template is a pure function of `ResumeDocument`, which is asserted
by rendering the same résumé through all three engines and checking every fact
survives.

The catalogue lists only templates that have an engine. The other four stay
seeded and inert until phase 8 — a model that renders as a blank page is
exactly the dead UI `AGENTS.md` forbids.

**Deliverable:** live preview that matches what the PDF will be.

## Phase 5 — PDF export ✅

`/render/[token]` headless route, the Playwright renderer in
`services/pdf-renderer/`, PDFs in private object storage, and `ExportHistory`
doubling as the queue with atomic claims and three attempts per job.

The renderer **pulls** work instead of being pushed it (ADR 0008), so it needs
no inbound URL, no database credentials and no storage token — and a worker
killed mid-render leaves a row the next poll reclaims rather than a lost
message.

`/render/[token]` prints the same `PaperSheet` the editor previews, under the
same stylesheet. The export gate promised in phase 3 is enforced here:
advisories still never block saving, but a résumé with unresolved pendências —
or with edits not yet saved — cannot be exported, because a PDF is what gets
handed to a client.

Export stays **hidden** until `RENDER_WORKER_SECRET` is set on both sides. An
unconfigured deployment has no PDF export rather than a button that does
nothing.

**Deliverable:** correct page breaks, one-page and multi-page, with and
without photo. **Exercised for real** against the production database: three
résumés queued, claimed, rendered and stored — Executivo one page, Minimalista
three, Moderno one with a photo, every sheet 595×842pt (A4 exactly).

Two bugs only a real render could have found:

- In print the decoration becomes `position: fixed`, which paints it in the
  positioned layer — _above_ a flow that print had made `static`. Moderno's
  colour band covered its entire sidebar: no name, no photo, no contacts. The
  flow is now `position: relative` with a z-index in print.
- "Comportamental" was pluralised by appending an "s". Portuguese words in -l
  take -is; the labels are written out now.

## Phase 6 — Client management (CRM) ✅

Client CRUD, a four-column board (novo pedido → aguardando dados → em
andamento → entregue), notes, timeline, and résumés linked to the person they
were made for.

Cards drag between columns on a desktop, but every card also carries a plain
`<select>` below `xl`: four columns do not fit on a phone, and a workflow that
only works with a mouse is not a workflow.

The timeline is **read straight out of `AuditLog`** — nothing writes to a
separate timeline table, so it cannot drift from what actually happened. It
records what changed, never the value: repeating a phone number on every edit
buries the history. Ownership is checked on the client before the log is read,
because audit rows are not themselves scoped to a user.

`ARCHIVED` is deliberately not a fifth column. Archiving is how a client leaves
the board; a column of finished work would grow without bound and squeeze the
useful ones a little more every month.

**Deliverable:** the complete request-to-delivery workflow. **Exercised for
real**: signed up through the UI, moved a card on a 420px viewport, confirmed
the status changed in the database and that the timeline read
"Situação: Novo pedido → Em andamento".

## Phase 7 — Version history

Named snapshots, restore, visual diff between versions.

**Deliverable:** v1/v2/v3 restorable and comparable.

## Phase 8 — Remaining templates and polish

Seven templates total (Moderno, Executivo, Minimalista, Tecnologia,
Administrativo, Primeiro Emprego, ATS Friendly), accessibility pass, LCP/INP
budget, mobile refinement.

**Deliverable:** Lighthouse ≥ 95, clean accessibility audit.

## Phase 9 — AI features

Provider abstraction, text improvement, ATS compatibility score, job-description
adaptation, token and cost accounting per analysis.

**Deliverable:** three AI features that work, with tracked cost.

## Phase 10 — SaaS preparation

Plans and usage limits, billing, onboarding, public landing page,
observability.

**Deliverable:** ready for external users.
