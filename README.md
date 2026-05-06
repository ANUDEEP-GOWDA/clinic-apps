# Clinic SaaS

A multi-tenant clinic management system with a built-in editable public website. Each clinic gets its own subpath (`/c/<slug>`), its own data (fully isolated), and its own login. Built for cloud deploy from day one — single Next.js app, single Postgres, optional S3-compatible storage.

What it gives you:

- Card-based workflow: every appointment, consultation, and follow-up is one Card moving through a state machine (`request → appointment → consultation`). Append-only patient data.
- CMS that controls the public site too — clinic name, hero, services, doctors, theme, SEO. One dashboard, two surfaces.
- Multi-tenant isolation: every read/write goes through `tenantPrisma(clinicId)`, which makes forgetting clinic scoping a type error rather than a data leak. Optional Postgres RLS as a second line of defense.
- Durable outbox for outbound side effects (WhatsApp reminders, future emails, webhooks). Survives the app going offline; retries with exponential backoff.
- Idempotency keys on public POST endpoints (booking, signup, call-request) — safe to retry on flaky networks.
- Sign-up flow built in. New clinics self-serve from `/signup`.
- MFA-ready (columns + login-flow stubs; the TOTP verify step is left for a focused follow-up).

---

## Quickstart — deploy to Railway in ~10 minutes

1. **Push this repo to GitHub.**

2. **Create a Railway project.** Add two services to it:
   - **Postgres** plugin (Railway provides one).
   - **The app** — connect your GitHub repo. Railway auto-detects Next.

3. **Set environment variables** on the app service (see `.env.example`):
   - `DATABASE_URL` — copy from Railway's Postgres plugin connection.
   - `SESSION_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.
   - `APP_URL` — your Railway public URL, no trailing slash.
   - `NODE_ENV=production`.
   - `STORAGE_DRIVER=local` *for the very first boot*; switch to `s3` once you set up R2 (see below).
   - `CRON_SECRET` — a random 16+ char string.

4. **Run the first migration + seed.** In Railway's "Deployments" → "Run command":
   ```
   npx prisma migrate deploy && npm run db:seed
   ```
   The seed creates a demo clinic. Note the credentials it prints.

5. **Visit your URL.**
   - `/` — landing page with sign-up + sign-in.
   - `/c/demo` — public website for the seeded demo clinic.
   - `/cms/login` — sign in (clinic slug `demo`, email `owner@example.com`, password `change-me-please-soon` unless you set `SEED_OWNER_PASSWORD`).

6. **Set up cron.** Three endpoints need scheduled hits:
   - `POST /api/cron/reminders` — every 5 minutes (drains outbox).
   - `POST /api/cron/backup` — daily at 2 AM (per-clinic JSON dumps).
   - `POST /api/cron/gc` — daily at 3 AM (garbage collection).

   Each request needs `Authorization: Bearer <CRON_SECRET>`. On Railway, use a cron service (Railway's own scheduled runs, or a free GitHub Action). On Vercel, the included `vercel.json` wires this up automatically.

7. **Add object storage** (when you want files to persist across deploys). Cloudflare R2 is free to start and doesn't require a credit card. Create a bucket, generate an access key, and set:
   ```
   STORAGE_DRIVER=s3
   STORAGE_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   STORAGE_S3_REGION=auto
   STORAGE_S3_BUCKET=<your-bucket>
   STORAGE_S3_ACCESS_KEY_ID=<key>
   STORAGE_S3_SECRET_ACCESS_KEY=<secret>
   STORAGE_S3_PUBLIC_URL_BASE=https://pub-<hash>.r2.dev   # only if bucket is public
   ```

That's it.

---

## Architecture at a glance

```
src/
  app/
    (public)/[clinicSlug]/    Public site for one clinic (resolved by slug)
    api/
      cms/...                 CMS APIs (require session; clinic-scoped)
      public/...              Public APIs (clinic resolved from URL)
      cron/...                Scheduled job endpoints (CRON_SECRET-gated)
    cms/...                   CMS dashboard (server components)
    page.tsx                  Marketing landing
    signup/                   New-clinic signup
  components/
    public/                   Public-site components
    cms/                      CMS components
  lib/
    auth.ts                   iron-session, login, lockout, MFA-ready
    tenant-prisma.ts          The wrapper that enforces clinicId scoping
    tenant.ts                 Resolve clinic from URL slug (public routes)
    permissions.ts            Role → action matrix (OWNER / DOCTOR / STAFF)
    cards/state-machine.ts    Card state machine (extracted, pure, testable)
    outbox/                   Durable queue: enqueue + drain + handlers
    storage.ts                Object storage abstraction (local / S3-compat)
    rate-limit.ts             Token-bucket per-IP/email
    idempotency.ts            X-Idempotency-Key handling for public POST
    env.ts                    Validated env vars (app refuses to start on bad config)
    log.ts                    Structured JSON logger
    route-handler.ts          Auth + permission + tenant boilerplate for CMS routes
    ssr-tenant.ts             Same, but for server components
prisma/
  schema.prisma               Postgres + multi-tenant schema
  migrations/_rls.sql         Optional Postgres Row-Level Security policies
  seed.ts                     Creates one demo clinic
scripts/
  restore-clinic.ts           Restore a single clinic from a JSON backup
```

### Tenant isolation, in two layers

1. **Application layer.** Every CMS route uses `tenantPrisma(session.clinicId)`. The wrapper merges `where: { clinicId }` into every read and injects `clinicId` into every write. Forgetting clinicId becomes structurally impossible. Public routes never receive `clinicId` from the client — the slug in the URL is the only source of truth.

2. **Database layer (optional).** Apply `prisma/migrations/_rls.sql` to enable Postgres Row-Level Security. Even if a future bug forgets a `where` clause, the DB will refuse to return other tenants' rows. See the comments in that file for setup.

### The Card state machine

The single most important piece of business logic lives in `src/lib/cards/state-machine.ts`. Pure functions, fully typed, exhaustive transition rules. Routes are thin wrappers around this.

Don't redesign it. Add new states/transitions by editing this file and adding a `plan...` function.

### The outbox (durable queue)

`OutboxJob` is a Postgres table that acts as a queue. WhatsApp reminders, future emails, future webhooks all enqueue jobs here instead of doing inline I/O. A worker (`/api/cron/reminders`) drains the queue with `FOR UPDATE SKIP LOCKED` so concurrent workers don't trip over each other. Failed jobs retry with exponential backoff.

This replaces the local-first cron-and-pray pattern v1 had. It's the foundation for "the system survives going offline."

### Roles

- **OWNER** — full clinic admin, manages users, edits website, all settings.
- **DOCTOR** — reads everything, edits consultation cards (their domain).
- **STAFF** — reception. Reads, creates and accepts/reschedules appointments. No consultation edits, no website edits.

Permission matrix: `src/lib/permissions.ts`. To change what a role can do, edit that file. To add a new role, add it to the `Role` enum, regen prisma, add a row to the matrix.

### What's intentionally NOT here

- No microservices. One Next.js app. Split when you have a measured reason.
- No GraphQL / tRPC / API gateway. Plain REST. Logic lives in `lib/` so a future tRPC mount is additive, not a rewrite.
- No event bus / Redis / BullMQ. Postgres + the outbox table carries you to several thousand clinics easily.
- No billing/Stripe wiring. Add when you want to charge.
- No fancy admin "super-admin across clinics" UI. Use `psql` for now.
- No localization. Add when needed.

---

## Local development (optional)

If you can run things locally:

```bash
cp .env.example .env
# Edit .env: at minimum set DATABASE_URL to a local Postgres.
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Visit:
- `http://localhost:3000` — landing
- `http://localhost:3000/c/demo` — demo public site
- `http://localhost:3000/cms/login` — sign in

---

## Adding a new feature later

The codebase is shaped so most new features fit one pattern:

1. Add fields to `prisma/schema.prisma`. Run `prisma migrate dev`.
2. If it's a new tenant table, add it to the `TENANT_MODELS` array in `src/lib/tenant-prisma.ts`.
3. Add the relevant action(s) to `src/lib/permissions.ts` and grant them to the right roles.
4. Add API route(s) using the `handler({ action }, async (ctx, req) => {...})` helper. Use `ctx.tdb` for DB access, `ctx.audit(...)` for audit log.
5. Add a CMS page using `const { tdb } = await ssrTenant()` for SSR.

That's it. You don't need to revisit auth, tenant scoping, error handling, or audit each time.

---

## License

Proprietary — all rights reserved by the project owner.
