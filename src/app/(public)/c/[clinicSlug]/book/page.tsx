import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicSnapshot } from '@/lib/content';
import BookingForm from '@/components/public/BookingForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Book an Appointment' };

export default async function BookPage({
  params,
}: {
  params: { clinicSlug: string };
}) {
  const snap = await getPublicSnapshot(params.clinicSlug);
  if (!snap) notFound();

  const acceptingDoctors = snap.doctors.filter((d) => d.acceptingAppointments);
  const homeHref = `/c/${params.clinicSlug}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href={homeHref} className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold">Book an Appointment</h1>
        <p className="mt-2 text-slate-600">
          Pick a doctor and a time. We&apos;ll confirm via WhatsApp shortly.
        </p>

        <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          {acceptingDoctors.length === 0 ? (
            <p className="text-slate-600">
              No doctors are currently accepting online bookings. Please call us to schedule.
            </p>
          ) : (
            <BookingForm doctors={acceptingDoctors} clinicSlug={params.clinicSlug} />
          )}
        </div>
      </div>
    </main>
  );
}
