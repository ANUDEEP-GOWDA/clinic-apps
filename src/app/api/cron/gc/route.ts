import { cronHandler } from '@/lib/cron';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/gc
 *
 * Daily cleanup of housekeeping tables. Cheap to run; prevents unbounded
 * growth.
 */
export const POST = cronHandler('gc', async () => {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60_000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60_000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60_000);

  const idem = await prisma.idempotencyKey.deleteMany({
    where: { createdAt: { lt: dayAgo } },
  });
  const reset = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: now } }, { usedAt: { lt: weekAgo } }],
    },
  });
  const cron = await prisma.cronRun.deleteMany({
    where: { startedAt: { lt: monthAgo } },
  });
  // Drop old completed/cancelled outbox jobs to keep the table lean.
  const outbox = await prisma.outboxJob.deleteMany({
    where: {
      status: { in: ['sent', 'cancelled', 'failed'] },
      updatedAt: { lt: weekAgo },
    },
  });

  return {
    idempotency_deleted: idem.count,
    password_resets_deleted: reset.count,
    cron_runs_deleted: cron.count,
    outbox_jobs_deleted: outbox.count,
  };
});
