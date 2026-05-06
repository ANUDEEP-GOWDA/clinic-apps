import { ssrTenant } from '@/lib/ssr-tenant';
import DailyCalendar from '@/components/cms/DailyCalendar';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { doctorId?: string; date?: string };
}) {
  const { tdb } = await ssrTenant();
  const doctors = await tdb.doctor.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
  });
  const settings = await tdb.settings.findFirst();
  const tz = settings?.timezone || 'Asia/Kolkata';

  const today = new Date();
  const date = searchParams.date || isoDate(today);
  const doctorId =
    searchParams.doctorId && Number(searchParams.doctorId)
      ? Number(searchParams.doctorId)
      : doctors[0]?.id ?? null;

  let dayData: {
    schedules: { startTime: string; endTime: string }[];
    overrides: { id: number; fullDayOff: boolean; blockStart: string | null; blockEnd: string | null; reason: string }[];
    cards: { id: number; slotDatetime: string; durationMin: number; patientName: string; type: string; state: string }[];
  } = { schedules: [], overrides: [], cards: [] };

  if (doctorId) {
    const [y, m, d] = date.split('-').map(Number);
    const start = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59));
    const dow = start.getUTCDay();
    const [schedules, overrides, cards] = await Promise.all([
      tdb.doctorSchedule.findMany({
        where: { doctorId, dayOfWeek: dow, active: true },
        select: { startTime: true, endTime: true },
      }),
      tdb.doctorDayOverride.findMany({
        where: { doctorId, date: { gte: start, lte: end } },
        select: { id: true, fullDayOff: true, blockStart: true, blockEnd: true, reason: true },
      }),
      tdb.card.findMany({
        where: {
          doctorId,
          slotDatetime: { gte: start, lte: end },
          type: { in: ['request', 'appointment', 'consultation'] },
          state: 'active',
        },
        include: { patient: true },
        orderBy: { slotDatetime: 'asc' },
      }),
    ]);
    dayData = {
      schedules,
      overrides,
      cards: cards.map((c:any) => ({
        id: c.id,
        slotDatetime: (c.slotDatetime as Date).toISOString(),
        durationMin: c.durationMin,
        patientName: c.patient.name,
        type: c.type,
        state: c.state,
      })),
    };
  }

  return (
    <DailyCalendar
      doctors={doctors.map((d) => ({
        id: d.id,
        name: d.name,
        consultationDurationMin: d.consultationDurationMin,
        acceptingAppointments: d.acceptingAppointments,
      }))}
      doctorId={doctorId}
      date={date}
      timezone={tz}
      dayData={dayData}
    />
  );
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}
