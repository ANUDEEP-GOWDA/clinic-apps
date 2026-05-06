/**
 * Outbox — durable queue for outbound side effects.
 *
 * Why this exists:
 *   - System goes offline → reminders can't be dropped on the floor. They
 *     sit in OutboxJob until a worker drains them.
 *   - Provider down (WhatsApp API hiccup) → retries with exponential backoff,
 *     up to maxAttempts.
 *   - Crash mid-send → at-most-once via row locking. Worker locks rows
 *     with status='processing' before calling out.
 *   - Multi-tenant safe → every job has clinicId.
 *   - Generic → kind='whatsapp_template' | 'email' | 'webhook'. Add a kind,
 *     add a handler in lib/outbox/handlers/, done.
 *
 * Anti-design (intentional):
 *   - No Redis, no BullMQ, no SQS. A Postgres table with the right indexes
 *     scales to millions of rows. When you genuinely outgrow it, swap.
 *     Until then this is one less moving part.
 *
 * Two operations:
 *   - enqueue(kind, payload, opts) — call from app code
 *   - drain(workerId) — called by /api/cron/reminders on a schedule
 */
import { prisma } from '../db';
import { log } from '../log';
import { handleWhatsappTemplate } from './handlers/whatsapp';

export type OutboxEnqueueOpts = {
  clinicId: number;
  kind: 'whatsapp_template' | 'email' | 'webhook';
  payload: Record<string, unknown>;
  scheduledAt?: Date;
  cardId?: number;
  maxAttempts?: number;
};

export async function enqueue(opts: OutboxEnqueueOpts): Promise<number> {
  const job = await prisma.outboxJob.create({
    data: {
      clinicId: opts.clinicId,
      kind: opts.kind,
      payload: opts.payload as object,
      scheduledAt: opts.scheduledAt ?? new Date(),
      cardId: opts.cardId ?? null,
      maxAttempts: opts.maxAttempts ?? 5,
    },
  });
  return job.id;
}

/**
 * Cancel pending jobs for a card (e.g. appointment cancelled — kill its
 * future reminders).
 */
export async function cancelForCard(clinicId: number, cardId: number): Promise<number> {
  const r = await prisma.outboxJob.updateMany({
    where: { clinicId, cardId, status: 'pending' },
    data: { status: 'cancelled' },
  });
  return r.count;
}

// ---------------------------------------------------------------------------
// Drain
// ---------------------------------------------------------------------------

const BATCH_SIZE = 25;
const BACKOFF_BASE_MIN = 5;

export async function drain(workerId: string): Promise<{
  picked: number;
  sent: number;
  failed: number;
  retried: number;
}> {
  const now = new Date();

  // Step 1: atomically claim a batch by setting status='processing'.
  // Use raw SQL for a SKIP LOCKED-style claim that's safe under concurrency.
  // (Two workers can drain in parallel without stepping on each other.)
  const claimed = await prisma.$queryRaw<Array<{ id: number }>>`
    UPDATE "OutboxJob"
    SET "status" = 'processing',
        "lockedAt" = ${now},
        "lockedBy" = ${workerId}
    WHERE "id" IN (
      SELECT "id" FROM "OutboxJob"
      WHERE "status" = 'pending'
        AND "scheduledAt" <= ${now}
      ORDER BY "scheduledAt" ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id"
  `;

  if (claimed.length === 0) {
    return { picked: 0, sent: 0, failed: 0, retried: 0 };
  }

  const ids = claimed.map((r) => r.id);
  const jobs = await prisma.outboxJob.findMany({ where: { id: { in: ids } } });

  let sent = 0;
  let failed = 0;
  let retried = 0;

  for (const job of jobs) {
    try {
      const result = await runJob(job);
      if (result.ok) {
        await prisma.outboxJob.update({
          where: { id: job.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            lockedAt: null,
            lockedBy: null,
            attempts: job.attempts + 1,
          },
        });
        sent++;
      } else {
        const newAttempts = job.attempts + 1;
        if (newAttempts >= job.maxAttempts) {
          await prisma.outboxJob.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              attempts: newAttempts,
              lastError: result.error.slice(0, 1000),
              lockedAt: null,
              lockedBy: null,
            },
          });
          failed++;
        } else {
          // Exponential backoff: 5min, 10min, 20min, 40min, 80min.
          const backoffMin = BACKOFF_BASE_MIN * Math.pow(2, newAttempts - 1);
          const next = new Date(Date.now() + backoffMin * 60_000);
          await prisma.outboxJob.update({
            where: { id: job.id },
            data: {
              status: 'pending',
              attempts: newAttempts,
              scheduledAt: next,
              lastError: result.error.slice(0, 1000),
              lockedAt: null,
              lockedBy: null,
            },
          });
          retried++;
        }
      }
    } catch (e) {
      // Unexpected exception — return job to pending for next sweep.
      log.error('outbox.drain.exception', { jobId: job.id, err: String(e) });
      await prisma.outboxJob.update({
        where: { id: job.id },
        data: {
          status: 'pending',
          lockedAt: null,
          lockedBy: null,
          lastError: String(e).slice(0, 1000),
        },
      });
      retried++;
    }
  }

  return { picked: jobs.length, sent, failed, retried };
}

type JobResult = { ok: true } | { ok: false; error: string };

async function runJob(job: {
  id: number;
  clinicId: number;
  kind: string;
  payload: unknown;
  cardId: number | null;
}): Promise<JobResult> {
  switch (job.kind) {
    case 'whatsapp_template':
      return handleWhatsappTemplate({
        clinicId: job.clinicId,
        cardId: job.cardId,
        payload: job.payload as Record<string, unknown>,
      });
    case 'email':
      // Stub: implement when you wire an email provider (Resend/Postmark).
      return { ok: false, error: 'email_handler_not_implemented' };
    case 'webhook':
      return { ok: false, error: 'webhook_handler_not_implemented' };
    default:
      return { ok: false, error: `unknown_kind:${job.kind}` };
  }
}
