import { ssrTenant } from '@/lib/ssr-tenant';
import CardBoard from '@/components/cms/CardBoard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { tdb } = await ssrTenant();
  const [requests, appointments, consultations, doctors] = await Promise.all([
    tdb.card.findMany({
      where: { type: 'request', state: 'active' },
      orderBy: { createdAt: 'desc' },
      include: { patient: true, doctor: true },
      take: 100,
    }),
    tdb.card.findMany({
      where: { type: 'appointment', state: 'active' },
      orderBy: { slotDatetime: 'asc' },
      include: { patient: true, doctor: true },
      take: 100,
    }),
    tdb.card.findMany({
      where: { type: 'consultation' },
      orderBy: { updatedAt: 'desc' },
      include: { patient: true, doctor: true },
      take: 100,
    }),
    tdb.doctor.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' } }),
  ]);

  const serialize = (cards: typeof requests) =>
    cards.map((c) => ({
      id: c.id,
      type: c.type,
      state: c.state,
      patientName: c.patient.name,
      doctorName: c.doctor.name,
      doctorId: c.doctorId,
      slotDatetime: c.slotDatetime ? c.slotDatetime.toISOString() : null,
      reasonForVisit: c.reasonForVisit,
      patientConfirmedAt: c.patientConfirmedAt ? c.patientConfirmedAt.toISOString() : null,
    }));

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <CardBoard
        requests={serialize(requests)}
        appointments={serialize(appointments)}
        consultations={serialize(consultations)}
        doctors={doctors.map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
