import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ssrTenant } from '@/lib/ssr-tenant';
import RequestCardView from '@/components/cms/RequestCardView';
import AppointmentCardView from '@/components/cms/AppointmentCardView';
import ConsultationCardView from '@/components/cms/ConsultationCardView';

export const dynamic = 'force-dynamic';

export default async function CardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { tdb } = await ssrTenant();
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const card = await tdb.card.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      service: true,
      consultationDetails: true,
      attachments: true,
      events: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!card) notFound();

  const otherCards = await tdb.card.findMany({
    where: { patientId: card.patientId, NOT: { id: card.id } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { doctor: true },
  });

  const serialized = serializeCard(card);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/cms/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
            ← Dashboard
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
            {card.type}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
            {card.state}
          </span>
        </div>

        {card.type === 'request' ? (
          <RequestCardView card={serialized} />
        ) : card.type === 'appointment' ? (
          <AppointmentCardView card={serialized} />
        ) : (
          <ConsultationCardView
            card={serialized}
            consultation={
              card.consultationDetails
                ? {
                    notes: card.consultationDetails.notes,
                    sentMessage: card.consultationDetails.sentMessage,
                  }
                : { notes: '', sentMessage: '' }
            }
            attachments={card.attachments.map((a) => ({
              id: a.id,
              filename: a.filename,
              path:
                env.STORAGE_DRIVER === 's3' && env.STORAGE_S3_PUBLIC_URL_BASE
                  ? `${env.STORAGE_S3_PUBLIC_URL_BASE.replace(/\/$/, '')}/${a.storageKey}`
                  : `/uploads/${a.storageKey}`,
              sizeBytes: a.sizeBytes,
            }))}
          />
        )}

        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="font-medium mb-3">History</h3>
          <ol className="space-y-2 text-sm">
            {card.events.length === 0 ? (
              <li className="text-slate-500">No events yet.</li>
            ) : (
              card.events.map((e) => (
                <li key={e.id} className="text-slate-700">
                  <span className="text-slate-400 text-xs">
                    {e.createdAt.toLocaleString()}
                  </span>{' '}
                  — {e.fromType ?? '·'} → {e.toType ?? '·'}{' '}
                  {e.fromState && e.toState ? `(${e.fromState} → ${e.toState})` : ''}
                </li>
              ))
            )}
          </ol>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="font-medium">Patient</h3>
          <div className="mt-2 text-sm">
            <div className="font-medium">{card.patient.name}</div>
            <div className="text-slate-500">{card.patient.phone}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="font-medium">Other cards for this patient</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {otherCards.length === 0 ? (
              <li className="text-slate-500">None.</li>
            ) : (
              otherCards.map((o) => (
                <li key={o.id}>
                  <Link href={`/cms/cards/${o.id}`} className="hover:underline">
                    <span className="capitalize">{o.type}</span> · {o.doctor.name} ·{' '}
                    {o.slotDatetime ? new Date(o.slotDatetime).toLocaleDateString() : '—'}{' '}
                    <span className="text-xs text-slate-500">({o.state})</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function serializeCard(c: { patient: { name: string; phone: string }; doctor: { name: string; id: number; consultationDurationMin: number }; [k: string]: unknown }) {
  // The signature above is loose to satisfy TS; we know it's non-null at call site.
  // We re-cast below for clarity.
  const card = c as unknown as {
    id: number; type: string; state: string;
    reasonForVisit: string; slotDatetime: Date | null; durationMin: number;
    patientConfirmedAt: Date | null;
    patient: { name: string; phone: string };
    doctor: { id: number; name: string; consultationDurationMin: number };
    parentCardId: number | null;
  };
  return {
    id: card.id,
    type: card.type,
    state: card.state,
    reasonForVisit: card.reasonForVisit,
    slotDatetime: card.slotDatetime ? card.slotDatetime.toISOString() : null,
    durationMin: card.durationMin,
    patientConfirmedAt: card.patientConfirmedAt ? card.patientConfirmedAt.toISOString() : null,
    patient: card.patient,
    doctor: { id: card.doctor.id, name: card.doctor.name },
    parentCardId: card.parentCardId,
  };
}
