import { handler } from '@/lib/route-handler';
import { runClinicBackup } from '@/lib/backup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * On-demand per-clinic backup. Writes a JSON dump of this clinic's data
 * to object storage. The cron equivalent is /api/cron/backup which loops
 * over all clinics — see lib/backup.ts.
 */
export const POST = handler({ action: 'backup.run' }, async (ctx) => {
  const r = await runClinicBackup({ clinicId: ctx.session.clinicId });
  await ctx.audit('backup.run', 'Backup', null, r as unknown as Record<string, unknown>);
  return ctx.ok(r);
});
