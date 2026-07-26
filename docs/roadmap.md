# Roadmap

One phase at a time. A phase is done only when the build is clean, `pnpm verify`
passes, the deploy works, and the deliverable below can actually be exercised by
a person.

| Phase  | Scope                            | Status  |
| ------ | -------------------------------- | ------- |
| **0**  | Foundation and architecture      | ✅ done |
| **1**  | Database and authentication      | ⏳ next |
| **2**  | App shell and dashboard          | —       |
| **3**  | Resume builder (core)            | —       |
| **4**  | Template engine and live preview | —       |
| **5**  | PDF export                       | —       |
| **6**  | Client management (CRM)          | —       |
| **7**  | Version history                  | —       |
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

## Phase 1 — Database and authentication

Full Prisma schema and migrations, template seed, Better Auth (email/password +
Google), protected routes, profile and settings, Railway Postgres wired through
the connection pooler.

**Deliverable:** sign up, sign in, edit profile.

## Phase 2 — App shell and dashboard

Sidebar on desktop, bottom navigation on mobile, safe areas, ⌘K command
palette, dashboard with real counts (resumes, drafts, clients, completed),
empty states, skeletons.

**Deliverable:** full navigation with metrics read from the database.

## Phase 3 — Resume builder (core)

`ResumeDocument` schema, every section (personal data, summary, experience,
education, skills, languages, certifications, projects, courses), debounced
autosave with a save indicator, drag-and-drop reordering, undo/redo, photo
upload.

**Deliverable:** create and edit a complete resume that persists.

## Phase 4 — Template engine and live preview

Template registry, shared primitives, three templates, instant switching
without data loss, print CSS, page zoom and pagination in the preview.

**Deliverable:** live preview that matches what the PDF will be.

## Phase 5 — PDF export

`/render/[token]` headless route, Playwright service on Railway, object
storage, `ExportHistory`, queueing and retry.

**Deliverable:** correct page breaks, one-page and multi-page, with and
without photo.

## Phase 6 — Client management (CRM)

Client CRUD, status kanban (new request → waiting info → in progress →
delivered), notes, timeline, linked resumes.

**Deliverable:** the complete request-to-delivery workflow.

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
