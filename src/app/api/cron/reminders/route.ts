import { cronHandler } from '@/lib/cron';
import { drain } from '@/lib/outbox';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/reminders
 *
 * Runs every 1-5 minutes (whatever your scheduler is set to). Drains a batch
 * of due jobs from the OutboxJob table — sending WhatsApp templates,
 * webhooks, etc. Failed jobs retry with exponential backoff up to maxAttempts.
 *
 * Workers are safe to run concurrently: row-level FOR UPDATE SKIP LOCKED
 * prevents two workers from picking the same job.
 */
export const POST = cronHandler('reminders', async () => {
  const workerId = `worker_${crypto.randomBytes(4).toString('hex')}`;
  const r = await drain(workerId);
  return r;
});
