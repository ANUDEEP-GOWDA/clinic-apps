-- =============================================================================
-- Optional: Postgres Row-Level Security policies for tenant isolation.
-- =============================================================================
--
-- The application enforces clinicId scoping via lib/tenant-prisma.ts. RLS is
-- a SECOND line of defense at the database level: even if a future bug
-- forgets a `where: { clinicId }`, Postgres will still refuse to return
-- other tenants' rows.
--
-- HOW TO USE
-- ----------
-- 1. Make sure the application connects with a non-superuser DB role (RLS
--    is bypassed for superusers). Most managed Postgres providers default
--    to a non-superuser app user — that's what you want.
--
-- 2. Apply this file ONCE after `prisma migrate deploy`:
--      psql "$DATABASE_URL" -f prisma/migrations/_rls.sql
--
-- 3. Configure your app to set the current clinic id per request, e.g. in
--    a Prisma middleware:
--      prisma.$use(async (params, next) => {
--        await prisma.$executeRaw`SELECT set_config('app.current_clinic', ${clinicId.toString()}, true)`;
--        return next(params);
--      });
--
--    (For simplicity v1 ships without this middleware — RLS is here as a
--    safety net you can opt into when the volume justifies the rigor.
--    Application-layer scoping via tenantPrisma() is mandatory and active.)
--
-- HOW IT WORKS
-- ------------
-- Each tenant table gets a policy: a row is visible only if its clinicId
-- equals the value of the per-session GUC `app.current_clinic`. We coerce
-- the GUC to int and treat NULL as "no access".
-- =============================================================================

-- Helper: a stable function returning the current clinic id from session GUC.
CREATE OR REPLACE FUNCTION app_current_clinic() RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_clinic', true), '')::int
$$;

-- Apply RLS to each tenant table. Public tables (Clinic itself,
-- PasswordResetToken, IdempotencyKey, CronRun) are intentionally excluded.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User','Settings','Doctor','DoctorSchedule','DoctorDayOverride',
    'Service','Patient','Card','CardEvent','ConsultationDetails',
    'ConsultationAttachment','CallRequest','Review','SiteContent',
    'Media','OutboxJob','WhatsappMessage','AuditLog'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    EXECUTE format(
      'DROP POLICY IF EXISTS tenant_isolation ON %I',
      t
    );
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING ("clinicId" = app_current_clinic())
         WITH CHECK ("clinicId" = app_current_clinic())',
      t
    );
  END LOOP;
END
$$;
