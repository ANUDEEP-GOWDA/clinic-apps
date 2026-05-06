'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CardViewModel } from './card-view-types';

export default function AppointmentCardView({ card }: { card: CardViewModel }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slotLabel = card.slotDatetime
    ? new Date(card.slotDatetime).toLocaleString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : '—';

  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cms/cards/${card.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) setError(j.error || 'Action failed.');
      else router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  const isPast = card.slotDatetime ? new Date(card.slotDatetime).getTime() < Date.now() : false;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Appointment</h2>
        <p className="text-sm text-slate-500">
          {card.patient.name} · {card.doctor.name}
        </p>
      </div>
      <dl className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Slot</dt>
          <dd className="font-medium">{slotLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Phone</dt>
          <dd>{card.patient.phone}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Patient confirmed</dt>
          <dd>
            {card.patientConfirmedAt ? (
              <span className="text-emerald-700">
                Yes · {new Date(card.patientConfirmedAt).toLocaleString()}
              </span>
            ) : (
              <span className="text-slate-400">Pending</span>
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Reason</dt>
          <dd>{card.reasonForVisit || <span className="text-slate-400">—</span>}</dd>
        </div>
      </dl>

      {card.state === 'active' ? (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => action({ to: 'consultation' })}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
          >
            Start Consultation
          </button>
          <button
            disabled={busy}
            onClick={() => action({ stateTo: 'cancelled' })}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
          >
            Cancel
          </button>
          <button
            disabled={busy || !isPast}
            title={!isPast ? 'Only after appointment time' : undefined}
            onClick={() => action({ stateTo: 'no_show' })}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40"
          >
            Mark No-Show
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">This appointment is {card.state}.</p>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
