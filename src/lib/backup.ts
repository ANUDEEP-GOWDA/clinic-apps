/**
 * Per-clinic logical backup.
 *
 * Why JSON-to-storage instead of pg_dump:
 *   - Multi-tenant: each clinic gets its own export, can be downloaded
 *     and shared with that clinic without leaking others.
 *   - Storage-agnostic: writes through lib/storage.ts (R2/S3/local).
 *   - Restorable: pure data, no DB-version lock-in. The structure mirrors
 *     Prisma models so a future restore tool walks JSON → prisma.create.
 *
 * For full-DB disaster recovery, rely on your managed Postgres provider's
 * point-in-time recovery (Neon, Supabase, Railway all offer this). This
 * function is for tenant-level snapshots, not infrastructure DR.
 *
 * The output is a single .json file per clinic per run, gzip-compressed
 * before upload.
 */
import { gzipSync } from 'node:zlib';
import { prisma } from './db';
import { storage } from './storage';
import { log } from './log';

export type BackupResult = {
  ok: boolean;
  storageKey?: string;
  sizeBytes?: number;
  rowCounts?: Record<string, number>;
  error?: string;
};

export async function runClinicBackup(opts: { clinicId: number }): Promise<BackupResult> {
  const { clinicId } = opts;

  try {
    const [
      clinic, settings, users, doctors, doctorSchedules, doctorDayOverrides,
      services, patients, cards, cardEvents, consultationDetails,
      consultationAttachments, callRequests, reviews, siteContent, media,
      whatsappMessages,
    ] = await Promise.all([
      prisma.clinic.findUnique({ where: { id: clinicId } }),
      prisma.settings.findUnique({ where: { clinicId } }),
      prisma.user.findMany({ where: { clinicId },
        select: { id: true, name: true, email: true, role: true, active: true,
          mfaEnabled: true, lastLoginAt: true, createdAt: true } }),
      prisma.doctor.findMany({ where: { clinicId } }),
      prisma.doctorSchedule.findMany({ where: { clinicId } }),
      prisma.doctorDayOverride.findMany({ where: { clinicId } }),
      prisma.service.findMany({ where: { clinicId } }),
      prisma.patient.findMany({ where: { clinicId } }),
      prisma.card.findMany({ where: { clinicId } }),
      prisma.cardEvent.findMany({ where: { clinicId } }),
      prisma.consultationDetails.findMany({ where: { clinicId } }),
      prisma.consultationAttachment.findMany({ where: { clinicId } }),
      prisma.callRequest.findMany({ where: { clinicId } }),
      prisma.review.findMany({ where: { clinicId } }),
      prisma.siteContent.findMany({ where: { clinicId } }),
      prisma.media.findMany({ where: { clinicId } }),
      prisma.whatsappMessage.findMany({
        where: { clinicId },
        // Cap log volume per backup; older messages stay in DB.
        orderBy: { createdAt: 'desc' },
        take: 10_000,
      }),
    ]);

    if (!clinic) return { ok: false, error: 'clinic_not_found' };

    const dump = {
      version: 1,
      backedUpAt: new Date().toISOString(),
      clinic,
      settings,
      users,
      doctors,
      doctorSchedules,
      doctorDayOverrides,
      services,
      patients,
      cards,
      cardEvents,
      consultationDetails,
      consultationAttachments,
      callRequests,
      reviews,
      siteContent,
      media,
      whatsappMessages,
    };

    const json = JSON.stringify(dump);
    const gz = gzipSync(Buffer.from(json, 'utf-8'));

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const put = await storage.put({
      clinicId,
      folder: 'backups',
      filename: `clinic-${clinic.slug}-${ts}.json.gz`,
      body: gz,
      mimeType: 'application/gzip',
    });

    const rowCounts = {
      users: users.length,
      doctors: doctors.length,
      doctorSchedules: doctorSchedules.length,
      doctorDayOverrides: doctorDayOverrides.length,
      services: services.length,
      patients: patients.length,
      cards: cards.length,
      cardEvents: cardEvents.length,
      consultationDetails: consultationDetails.length,
      consultationAttachments: consultationAttachments.length,
      callRequests: callRequests.length,
      reviews: reviews.length,
      siteContent: siteContent.length,
      media: media.length,
      whatsappMessages: whatsappMessages.length,
    };

    return {
      ok: true,
      storageKey: put.storageKey,
      sizeBytes: gz.byteLength,
      rowCounts,
    };
  } catch (e) {
    log.error('backup.failed', { clinicId, err: String(e) });
    return { ok: false, error: String(e) };
  }
}

/**
 * Backup all active clinics. Called by /api/cron/backup.
 */
export async function runAllClinicsBackup(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{ clinicId: number; ok: boolean; error?: string }>;
}> {
  const clinics = await prisma.clinic.findMany({
    where: { active: true },
    select: { id: true, slug: true },
  });
  let succeeded = 0;
  let failed = 0;
  const results: Array<{ clinicId: number; ok: boolean; error?: string }> = [];
  for (const c of clinics) {
    const r = await runClinicBackup({ clinicId: c.id });
    if (r.ok) succeeded++;
    else failed++;
    results.push({ clinicId: c.id, ok: r.ok, error: r.error });
  }
  return { total: clinics.length, succeeded, failed, results };
}
