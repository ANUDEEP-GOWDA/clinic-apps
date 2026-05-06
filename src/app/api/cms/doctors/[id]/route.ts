import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ScheduleInput = { dayOfWeek: number; startTime: string; endTime: string; active?: boolean };

export const PATCH = handler<{ id: string }>(
  { action: 'doctor.update' },
  async (ctx, req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');
    const body = await req.json().catch(() => ({}));

    const data: Record<string, unknown> = {};
    for (const key of [
      'name', 'slug', 'photoUrl', 'qualifications', 'bio', 'specialties',
      'yearsExperience', 'consultationDurationMin', 'acceptingAppointments',
      'displayOrder', 'active',
    ]) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    // updateMany so the clinic scope is enforced through the wrapper.
    const r = await ctx.tdb.doctor.updateMany({ where: { id }, data });
    if (r.count === 0) return ctx.notFound();

    // Schedule full-replace if provided. Stay inside a transaction so a
    // half-applied replace can't happen.
    if (Array.isArray(body.schedules)) {
      const list = body.schedules as ScheduleInput[];
      await ctx.tdb.transaction(async (tx:any) => {
        await tx.doctorSchedule.deleteMany({ where: { doctorId: id } });
        if (list.length > 0) {
          await tx.doctorSchedule.createMany({
            data: list.map((s) => ({
              doctorId: id,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              active: s.active ?? true,
            })),
          });
        }
      });
    }

    await ctx.audit('doctor.updated', 'Doctor', id, {
      fields: Object.keys(data),
    });
    return ctx.ok({ ok: true });
  }
);

/**
 * Soft-delete only. Hard delete would orphan cards and break the audit
 * trail. Foundation rule: nothing is deleted from the app layer.
 */
export const DELETE = handler<{ id: string }>(
  { action: 'doctor.deactivate' },
  async (ctx, _req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');
    const r = await ctx.tdb.doctor.updateMany({
      where: { id },
      data: { active: false },
    });
    if (r.count === 0) return ctx.notFound();
    await ctx.audit('doctor.deactivated', 'Doctor', id);
    return ctx.ok({ ok: true });
  }
);
