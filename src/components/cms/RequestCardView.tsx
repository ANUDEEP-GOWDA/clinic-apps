'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CardViewModel } from './card-view-types';

export default function RequestCardView({ card }: { card: CardViewModel }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newSlot, setNewSlot] = useState(card.slotDatetime ?? '');
  const [rejectNote, setRejectNote] = useState('');
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
      if (!res.ok || !j.ok) {
        setError(j.error || 'Action failed.');
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Appointment Request</h2>
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
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Reason</dt>
          <dd>{card.reasonForVisit || <span className="text-slate-400">—</span>}</dd>
        </div>
      </dl>

      {card.state === 'active' ? (
        <>
          {editing ? (
            <div className="rounded-xl border border-slate-100 p-4 space-y-3">
              <label className="block text-sm font-medium">New slot (datetime)</label>
              <input
                type="datetime-local"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={toLocalInput(newSlot)}
                onChange={(e) => setNewSlot(fromLocalInput(e.target.value))}
              />
              <div className="flex gap-2">
                <button
                  disabled={busy || !newSlot}
                  onClick={() => action({ to: 'appointment', newSlotDatetime: newSlot })}
                  className="px-3 py-1.5 text-sm rounded-xl bg-[var(--color-primary)] text-white disabled:opacity-50"
                >
                  Save & Approve
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-sm rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={() => action({ to: 'appointment' })}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
              >
                Edit Slot & Approve
              </button>
            </div>
          )}

          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-2">
            <label className="block text-sm font-medium">Reject (optional note)</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (kept internal)"
            />
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => action({ stateTo: 'rejected', note: rejectNote })}
                className="px-3 py-1.5 text-sm rounded-xl bg-red-600 text-white disabled:opacity-50"
              >
                Reject
              </button>
              <button
                disabled={busy}
                onClick={() => action({ stateTo: 'cancelled', note: 'cancelled by clinic' })}
                className="px-3 py-1.5 text-sm rounded-xl border border-slate-200"
              >
                Cancel Request
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">This request is {card.state}.</p>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

// Helpers to convert ISO <-> input[type=datetime-local] value
function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): string {
  if (!v) return '';
  return new Date(v).toISOString();
}
