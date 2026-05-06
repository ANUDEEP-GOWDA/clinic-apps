'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

type Doctor = {
  id: number;
  name: string;
  consultationDurationMin: number;
  acceptingAppointments: boolean;
};

type Card = {
  id: number;
  slotDatetime: string;
  durationMin: number;
  patientName: string;
  type: string;
  state: string;
};

type Override = {
  id: number;
  fullDayOff: boolean;
  blockStart: string | null;
  blockEnd: string | null;
  reason: string;
};

type Props = {
  doctors: Doctor[];
  doctorId: number | null;
  date: string;
  timezone: string;
  dayData: {
    schedules: { startTime: string; endTime: string }[];
    overrides: Override[];
    cards: Card[];
  };
};

export default function DailyCalendar({ doctors, doctorId, date, dayData }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function navigate(next: { doctorId?: number; date?: string }) {
    const u = new URLSearchParams();
    u.set('doctorId', String(next.doctorId ?? doctorId ?? ''));
    u.set('date', next.date ?? date);
    router.push(`/cms/calendar?${u.toString()}`);
  }

  async function addBlock(opts: { fullDayOff?: boolean }) {
    if (!doctorId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cms/doctors/${doctorId}/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          fullDayOff: !!opts.fullDayOff,
          blockStart: opts.fullDayOff ? null : blockStart,
          blockEnd: opts.fullDayOff ? null : blockEnd,
          reason,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) setError(j.error || 'Failed.');
      else {
        setShowAdd(false);
        setBlockStart('');
        setBlockEnd('');
        setReason('');
        router.refresh();
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function removeOverride(id: number) {
    setBusy(true);
    try {
      await fetch(`/api/cms/doctors/${doctorId}/overrides?overrideId=${id}`, {
        method: 'DELETE',
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleAccepting() {
    if (!doctorId) return;
    const cur = doctors.find((d) => d.id === doctorId);
    if (!cur) return;
    setBusy(true);
    try {
      await fetch(`/api/cms/doctors/${doctorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingAppointments: !cur.acceptingAppointments }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const currentDoctor = doctors.find((d) => d.id === doctorId);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <h1 className="text-xl font-semibold mr-auto">Calendar</h1>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Doctor</label>
          <select
            value={doctorId ?? ''}
            onChange={(e) => navigate({ doctorId: Number(e.target.value) })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => navigate({ date: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
          />
        </div>
      </div>

      {currentDoctor ? (
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span>
            Currently{' '}
            <span className={currentDoctor.acceptingAppointments ? 'text-emerald-700' : 'text-red-700'}>
              {currentDoctor.acceptingAppointments ? 'accepting' : 'NOT accepting'}
            </span>{' '}
            appointments
          </span>
          <button
            disabled={busy}
            onClick={toggleAccepting}
            className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
          >
            {currentDoctor.acceptingAppointments ? 'Stop taking appointments' : 'Resume appointments'}
          </button>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5">
          <h2 className="font-medium mb-3">
            {new Date(date).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </h2>
          {dayData.schedules.length === 0 ? (
            <p className="text-sm text-slate-500">No working hours configured for this day.</p>
          ) : (
            <ul className="text-sm text-slate-600 space-y-1 mb-4">
              {dayData.schedules.map((s, i) => (
                <li key={i}>
                  Working: <span className="font-medium">{s.startTime}</span> – <span className="font-medium">{s.endTime}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="font-medium mt-4 mb-2 text-sm">Appointments</h3>
          {dayData.cards.length === 0 ? (
            <p className="text-sm text-slate-500">None.</p>
          ) : (
            <ul className="space-y-2">
              {dayData.cards.map((c) => {
                const t = new Date(c.slotDatetime);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/cms/cards/${c.id}`}
                      className="block text-sm rounded-xl border border-slate-100 px-3 py-2 hover:bg-slate-50"
                    >
                      <span className="font-medium">
                        {t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span className="ml-2">{c.patientName}</span>
                      <span className="ml-2 text-xs text-slate-500 capitalize">({c.type})</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h2 className="font-medium mb-3">Non-availability blocks</h2>
          {dayData.overrides.length === 0 ? (
            <p className="text-sm text-slate-500">None for this date.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {dayData.overrides.map((o) => (
                <li key={o.id} className="flex items-start justify-between text-sm">
                  <div>
                    <div className="font-medium">
                      {o.fullDayOff ? 'Full day off' : `${o.blockStart} – ${o.blockEnd}`}
                    </div>
                    {o.reason ? <div className="text-xs text-slate-500">{o.reason}</div> : null}
                  </div>
                  <button
                    onClick={() => removeOverride(o.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showAdd ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <input
                  type="time"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy || !blockStart || !blockEnd}
                  onClick={() => addBlock({})}
                  className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-50"
                >
                  Add block
                </button>
                <button
                  disabled={busy}
                  onClick={() => addBlock({ fullDayOff: true })}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                >
                  Mark full day off
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-1.5 text-sm rounded-lg text-slate-500"
                >
                  Cancel
                </button>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200"
            >
              Add non-availability
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
