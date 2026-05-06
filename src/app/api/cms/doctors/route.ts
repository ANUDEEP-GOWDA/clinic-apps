import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ScheduleInput = { dayOfWeek: number; startTime: string; endTime: string; active?: boolean };

type DoctorInput = {
  name: string; slug: string; photoUrl?: string;
  qualifications?: string; bio?: string; specialties?: string;
  yearsExperience?: number; consultationDurationMin?: number;
  acceptingAppointments?: boolean; displayOrder?: number; active?: boolean;
  schedules?: ScheduleInput[];
};

export const POST = handler({ action: 'doctor.create' }, async (ctx, req) => {
  const body = (await req.json().catch(() => ({}))) as Partial<DoctorInput>;
  if (!body.name || !body.slug) return ctx.bad('missing_fields');

  const created = await ctx.tdb.doctor.create({
    data: {
      name: body.name,
      slug: body.slug,
      photoUrl: body.photoUrl ?? '',
      qualifications: body.qualifications ?? '',
      bio: body.bio ?? '',
      specialties: body.specialties ?? '',
      yearsExperience: body.yearsExperience ?? 0,
      consultationDurationMin: body.consultationDurationMin ?? 15,
      acceptingAppointments: body.acceptingAppointments ?? true,
      displayOrder: body.displayOrder ?? 0,
      active: body.active ?? true,
      // Nested schedules: each child needs clinicId too. The wrapper handles
      // the parent; nested writes need explicit clinicId on each child row.
      schedules: body.schedules?.length
        ? {
            create: body.schedules.map((s) => ({
              clinicId: ctx.session.clinicId,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              active: s.active ?? true,
            })),
          }
        : undefined,
    },
  });

  await ctx.audit('doctor.created', 'Doctor', created.id);
  return ctx.ok({ ok: true, id: created.id });
});

export const GET = handler({ action: 'doctor.read' }, async (ctx) => {
  const doctors = await ctx.tdb.doctor.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { schedules: true },
  });
  return ctx.ok({ doctors });
});
