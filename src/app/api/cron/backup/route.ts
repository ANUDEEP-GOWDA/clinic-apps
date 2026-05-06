import { cronHandler } from '@/lib/cron';
import { runAllClinicsBackup } from '@/lib/backup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/backup
 *
 * Runs nightly. Logical per-clinic JSON dump to object storage. Disaster
 * recovery for the database itself relies on your managed Postgres
 * provider's PITR — this is for tenant-level snapshots.
 */
export const POST = cronHandler('backup', async () => {
  const r = await runAllClinicsBackup();
  return r as unknown as Record<string, unknown>;
});
