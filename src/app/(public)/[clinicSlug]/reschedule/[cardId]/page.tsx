import Link from 'next/link';

export const metadata = { title: 'Reschedule', robots: { index: false } };

// v1: rescheduling handled by clinic staff via phone/WhatsApp.
// Self-service rescheduling will use Card.publicId as a signed token.
export default function ReschedulePage({
  params,
}: {
  params: { clinicSlug: string; cardId: string };
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        <Link
          href={`/c/${params.clinicSlug}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to home
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Reschedule your appointment</h1>
        <p className="mt-3 text-slate-600">
          To reschedule, please reply to our WhatsApp message or call the clinic. We&apos;ll find a
          time that works for you.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Self-service rescheduling will be available in a future update.
        </p>
      </div>
    </main>
  );
}
