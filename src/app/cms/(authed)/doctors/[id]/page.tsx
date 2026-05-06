import { notFound } from 'next/navigation';
import { ssrTenant } from '@/lib/ssr-tenant';
import DoctorEditor from '@/components/cms/DoctorEditor';

export const dynamic = 'force-dynamic';

export default async function DoctorEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { tdb } = await ssrTenant();
  if (params.id === 'new') {
    return (
      <DoctorEditor
        doctor={null}
        schedules={[]}
      />
    );
  }
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const doctor = await tdb.doctor.findUnique({
    where: { id },
    include: { schedules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } },
  });
  if (!doctor) notFound();

  return (
    <DoctorEditor
      doctor={{
        id: doctor.id,
        name: doctor.name,
        slug: doctor.slug,
        photoUrl: doctor.photoUrl,
        qualifications: doctor.qualifications,
        bio: doctor.bio,
        specialties: doctor.specialties,
        yearsExperience: doctor.yearsExperience,
        consultationDurationMin: doctor.consultationDurationMin,
        acceptingAppointments: doctor.acceptingAppointments,
        displayOrder: doctor.displayOrder,
        active: doctor.active,
      }}
      schedules={doctor.schedules.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        active: s.active,
      }))}
    />
  );
}
