/**
 * Audit log writer. Centralized so callsites stay one-liners.
 *
 * Always include clinicId — every action belongs to one tenant. The schema
 * now has structured columns (action, entityType, entityId, userId,
 * clinicId) so common queries don't need JSONB extraction.
 *
 * For richer context use `payload` (JSONB).
 */
import { prisma } from './db';
import { log } from './log';

export async function audit(opts: {
  clinicId: number;
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        clinicId: opts.clinicId,
        userId: opts.userId ?? null,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        payload: (opts.payload ?? {}) as object,
      },
    });
  } catch (e) {
    // Audit failure must never break the user-facing operation.
    log.error('audit.write_failed', {
      err: String(e),
      action: opts.action,
      clinicId: opts.clinicId,
    });
  }
}
