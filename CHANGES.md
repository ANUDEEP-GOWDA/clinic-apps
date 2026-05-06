# CHANGES — refactor from single-clinic v1 to multi-tenant SaaS

This document explains what changed, file by file, in moving from the v1
local-first single-clinic build to the v2 multi-tenant cloud-native SaaS.

The Card state machine and CMS-controls-the-website concepts are unchanged
— they're the soul of the product. Everything else got a haircut.

## Top-level

- **`prisma/schema.prisma`** — fully rewritten. Postgres provider; new
  `Clinic` model and `Role` enum (OWNER/DOCTOR/STAFF); `clinicId` on every
  tenant-owned table including `Settings`, `User`, `OutboxJob`, etc.;
  `Doctor.slug` is now unique per clinic; `Card.publicId` for opaque public
  URLs; MFA columns (`mfaEnabled`, `mfaSecret`); login lockout columns;
  new tables `OutboxJob` (durable queue), `IdempotencyKey`, `CronRun`,
  `PasswordResetToken`. Composite indexes optimized for clinic-scoped reads.
- **`prisma/migrations/_rls.sql`** *(new)* — optional Postgres Row-Level
  Security policies for defense-in-depth tenant isolation.
- **`prisma/seed.ts`** — rewritten. Idempotently creates one demo clinic
  (`slug=demo`) with an OWNER user, settings, one doctor, one service.
- **`scripts/restore-clinic.ts`** *(replaces `restore-backup.ts`)* —
  restores a clinic from a JSON.gz dump (the new backup format).
- **`package.json`** — switched to Postgres + S3 deps; added `otplib` for
  future MFA; removed `node-cron`, `archiver`, `googleapis`, the worker
  scripts, and the SQLite-flavored toolchain.
- **`next.config.js`** — added `output: 'standalone'` for the Docker image.
- **`middleware.ts`** — removed the `PUBLIC_DEPLOY` branching (no more
  separate public deployment). Just gates `/cms/*` and `/api/cms/*`.
- **`Dockerfile`, `.env.example`, `vercel.json`, `README.md`** *(new)* —
  deployment surface.

## `src/lib/` — foundation

### New

- **`env.ts`** — single typed env loader; app refuses to start on bad config.
- **`log.ts`** — structured JSON logger (swap impl for Sentry/Axiom later).
- **`tenant-prisma.ts`** — the load-bearing isolation guard. Wraps Prisma
  so every read merges `where: { clinicId }` and every write injects
  `clinicId`. Forgetting clinic scoping is structurally impossible.
- **`tenant.ts`** — resolves clinic from URL slug for public routes (cached).
- **`permissions.ts`** — role → action matrix.
- **`rate-limit.ts`** — in-memory token-bucket per IP/email.
- **`idempotency.ts`** — X-Idempotency-Key handling for public POST
  endpoints (Stripe pattern).
- **`storage.ts`** — file storage abstraction. Local driver for dev,
  S3-compatible (R2/Backblaze/AWS/MinIO) for prod.
- **`route-handler.ts`** — DRY wrapper for CMS API routes (auth +
  permission + tenant + audit + error handling in one helper).
- **`ssr-tenant.ts`** — same idea, for server components.
- **`cards/state-machine.ts`** — the Card state machine extracted from
  the 220-line route handler into pure typed functions. The logic is
  unchanged; it just has a proper home now.
- **`outbox/index.ts`** — durable queue. `enqueue()` + `drain()` with
  `FOR UPDATE SKIP LOCKED` for concurrent workers and exponential backoff.
- **`outbox/handlers/whatsapp.ts`** — first concrete handler; sends
  WhatsApp template messages via the existing client.
- **`cron.ts`** — auth + run-tracking helper for `/api/cron/*` endpoints.

### Rewritten

- **`auth.ts`** — session is now `{ userId, clinicId, clinicSlug, role,
  email, name }`. `requireSession()` throws if any of userId/clinicId/role
  is missing or if MFA is pending. Login takes `clinicSlug` so two clinics
  can share an email. bcrypt cost 12 (was 10). Failed-login counter +
  15-minute lockout. Half-session for MFA-enabled users (verify endpoint
  is left as a future step). `loginUser` does constant-ish-time response
  on missing user vs bad password to avoid email enumeration.
- **`db.ts`** — Postgres-only; logs warnings + errors in dev, errors in prod.
- **`audit.ts`** — takes structured columns (`clinicId`, `userId`,
  `action`, `entityType`, `entityId`) plus JSONB `payload`. Failure to
  write the audit row is logged but does not break the user-facing op.
- **`whatsapp.ts`** — every send is scoped by `clinicId`; logs go into
  `WhatsappMessage` per clinic.
- **`reviews-google.ts`** — takes `clinicId`; reads each clinic's own
  `googlePlaceId` from per-clinic Settings.
- **`backup.ts`** — replaces SQLite-zip backup. Per-clinic JSON.gz dump
  written through the storage abstraction (local or S3). Plus
  `runAllClinicsBackup()` for the daily cron.
- **`content.ts`** — `getPublicSnapshot(slug)` reads Postgres directly.
  No more Upstash snapshot pipeline.
- **`slots.ts`** — every query takes `clinicId`.
- **`theme.ts`, `working-hours.ts`** — `parseTheme` / `parseWorkingHours`
  now accept either a JSON object (Postgres JSONB) or a JSON string
  (legacy compat).
- **`seo.ts`** — uses `env.APP_URL + /c/<slug>` for canonical URLs (was
  `process.env.PUBLIC_SITE_URL`).

### Deleted

- **`upstash.ts`, `sync.ts`** — the local-first snapshot/sync pipeline
  is gone. There's only one deployment now and it reads Postgres directly.
- **`card-types.ts`** — superseded by `cards/state-machine.ts`.

## `src/app/api/cms/` — CMS routes

All ~16 routes were rewritten to use the `handler({ action }, fn)` pattern.
Each gets:
- `requireSession()` automatically (or 401)
- permission check from `permissions.ts` (or 403)
- a tenant-scoped `tdb` client (so all queries are auto-clinic-filtered)
- a sugary `ctx.audit(...)` helper

Specific notes:
- **`auth/login`** — body now requires `clinicSlug` alongside email/password.
  Rate-limited per IP. Returns `{ ok, requiresMfa? }`.
- **`auth/logout`** — unchanged shape.
- **`doctors`, `doctors/[id]`** — DELETE is now a soft-deactivate (sets
  `active=false`), in line with the "no patient data deletion" rule.
- **`cards/[id]/transition`** — shrunk from 220 to ~190 lines; the state
  machine itself moved to `lib/cards/state-machine.ts`. Outbox enqueues
  replace inline reminder logic.
- **`cards/[id]/attachments`, `media/upload`** — go through `storage.ts`.
- **`backup/run`** — calls `lib/backup.runClinicBackup({clinicId})`.
- **`sync/pull`, `sync/publish`** — DELETED.

## `src/app/api/public/` — public routes

All take clinic from the URL (`?clinic=<slug>` or Referer-derived) — never
from the body. Idempotency keys + per-IP rate limits applied.

- **`booking`** — clinic-scoped, idempotent, returns `cardPublicId`.
- **`slots`** — clinic-scoped reads; calls slot helpers with `clinicId`.
- **`call-request`** — clinic-scoped, idempotent.
- **`whatsapp-webhook`** — resolves tenant via `Card.publicId` for
  confirm-button payloads or via patient phone match for inbound text.
- **`signup`** *(new)* — creates a new Clinic + first OWNER user atomically.
  Slug-validated, rate-limited, idempotent. Optional `SIGNUP_INVITE_CODE`
  gate for closed beta.

## `src/app/api/cron/` — *(new)*

- **`reminders`** — drains the outbox.
- **`backup`** — runs per-clinic JSON backups.
- **`gc`** — daily GC: expired idempotency keys, password resets, old
  cron runs, settled outbox jobs.

All gated by `Authorization: Bearer ${CRON_SECRET}`.

## `src/app/(public)/` — public site

The whole public site moved under `/c/[clinicSlug]/`:
- **`[clinicSlug]/layout.tsx`** — resolves clinic by slug; renders theme
  CSS vars + JSON-LD.
- **`[clinicSlug]/page.tsx`** — homepage, scoped to the resolved clinic.
- **`[clinicSlug]/book/page.tsx`** — booking flow.
- **`[clinicSlug]/reschedule/[cardId]/page.tsx`** — kept as a placeholder
  page; self-service reschedule is a future feature using the card's
  `publicId` as a signed token.
- **`[clinicSlug]/robots.ts`, `sitemap.ts`** — per-clinic.

Components in `src/components/public/` updated where they linked back
home (now use `/c/${snap.clinic.slug}`).

## `src/app/page.tsx` — *(new)*

Root marketing landing. Shows the value prop + sign-up + sign-in.

## `src/app/signup/` — *(new)*

Sign-up page UI for new clinics. Auto-suggests slug from clinic name.

## `src/app/cms/` — CMS dashboard

- **`(auth)/login/page.tsx`** — added the clinic-slug field (auto-fills
  from `?clinic=` query param, so password-reset emails can deep-link).
- **`(authed)/layout.tsx`** — defaults role to `'STAFF'` (was `'assistant'`).
- All authed pages — replaced direct `prisma.*` usage with `tdb.*` from
  `ssrTenant()`. Settings is now per-clinic (`tdb.settings.findFirst()`
  instead of `findUnique({where:{id:1}})`). Site content lookups use
  `findFirst({where:{key}})` (the unique key is composite `(clinicId,key)`).
- **Media page** — resolves storage URLs through the new abstraction.

## `src/workers/` — DELETED

The reminder/sync/backup workers are now HTTP cron endpoints under
`/api/cron/*`. Hit them on a schedule from any cron platform.

## Things deferred to later (intentionally)

- The TOTP/MFA verify flow is wired but stubbed. Adding it = ~30 lines
  in `auth.ts` + an `/api/cms/auth/mfa/verify` route + a UI step.
- Self-service rescheduling via signed publicId.
- Per-clinic billing / Stripe.
- A super-admin (cross-clinic) dashboard.
- Subdomain-based tenant URLs (currently path-based: `/c/<slug>`).
- Localization.

Each is additive. The foundation doesn't fight any of them.
