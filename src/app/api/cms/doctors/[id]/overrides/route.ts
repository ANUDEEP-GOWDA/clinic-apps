import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OverrideInput = {
  date: string; // YYYY-MM-DD
  fullDayOff?: boolean;
  blockStart?: string | null;
  blockEnd?: string | null;
  reason?: string;
};

export const POST = handler<{ id: string }>(
  { action: 'doctor.update' },
  async (ctx, req, params) => {
    const doctorId = Number(params.id);
    if (!Number.isInteger(doctorId)) return ctx.bad('bad_id');

    // Confirm the doctor belongs to this clinic before adding override.
    const doctor = await ctx.tdb.doctor.findFirst({ where: { id: doctorId } });
    if (!doctor) return ctx.notFound();

    const body = (await req.json().catch(() => ({}))) as OverrideInput;
    if (!body.date) return ctx.bad('missing_date');
    if (!body.fullDayOff && (!body.blockStart || !body.blockEnd)) {
      return ctx.bad('missing_block_range');
    }
    const [y, m, d] = body.date.split('-').map(Number);
    const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0));
    const created = await ctx.tdb.doctorDayOverride.create({
      data: {
        doctorId,
        date,
        fullDayOff: !!body.fullDayOff,
        blockStart: body.fullDayOff ? null : body.blockStart ?? null,
        blockEnd: body.fullDayOff ? null : body.blockEnd ?? null,
        reason: body.reason ?? '',
      },
    });
    await ctx.audit('doctor.override_added', 'DoctorDayOverride', created.id, {
      doctorId,
      date: body.date,
    });
    return ctx.ok({ ok: true, id: created.id });
  }
);

export const DELETE = handler<{ id: string }>(
  { action: 'doctor.update' },
  async (ctx, req, params) => {
    const doctorId = Number(params.id);
    const overrideId = Number(new URL(req.url).searchParams.get('overrideId'));
    if (!Number.isInteger(overrideId)) return ctx.bad('bad_override_id');

    const r = await ctx.tdb.doctorDayOverride.deleteMany({
      where: { id: overrideId, doctorId },
    });
    if (r.count === 0) return ctx.notFound();
    await ctx.audit(
      'doctor.override_removed',
      'DoctorDayOverride',
      overrideId,
      { doctorId }
    );
    return ctx.ok({ ok: true });
  }
);
