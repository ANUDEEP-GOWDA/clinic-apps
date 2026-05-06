'use client';

import { useEffect, useMemo, useState } from 'react';

type Doctor = {
  id: number;
  name: string;
  qualifications: string;
  specialties: string;
  consultationDurationMin: number;
};

type Slot = { datetime: string; durationMin: number };

export default function BookingForm({
  doctors,
  clinicSlug,
}: {
  doctors: Doctor[];
  clinicSlug: string;
}) {
  const [doctorId, setDoctorId] = useState<number | null>(doctors[0]?.id ?? null);
  const [date, setDate] = useState<string>(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build next-30-day list for date dropdown
  const dateOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const value = isoDate(d);
      const label = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      out.push({ value, label });
    }
    return out;
  }, []);

  useEffect(() => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(`/api/public/slots?clinic=${encodeURIComponent(clinicSlug)}&doctorId=${doctorId}&date=${date}`)
      .then((r) => r.json())
      .then((j) => setSlots(Array.isArray(j.slots) ? j.slots : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctorId, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!doctorId || !selectedSlot) {
      setError('Please pick a slot.');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    setSubmitting(true);
    try {
      // Idempotency key: random per-attempt so the same submit can retry
      // safely after a network blip without double-booking.
      const idempotencyKey = (() => {
        try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random()}`; }
      })();
      const res = await fetch(
        `/api/public/booking?clinic=${encodeURIComponent(clinicSlug)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            doctorId,
            slotDatetime: selectedSlot,
            patient: { name: name.trim(), phone: phone.trim() },
            reasonForVisit: reason.trim(),
          }),
        }
      );
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setError(j.error || 'Submission failed. Please try again.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl">✅</div>
        <h2 className="mt-4 text-xl font-semibold">Request received</h2>
        <p className="mt-2 text-slate-600">
          We&apos;ll send a WhatsApp confirmation shortly. If you don&apos;t hear back, please call us.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">Doctor</label>
        <select
          className="w-full rounded-2xl border border-slate-200 px-3 py-2"
          value={doctorId ?? ''}
          onChange={(e) => setDoctorId(Number(e.target.value))}
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.specialties ? ` — ${d.specialties}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <select
          className="w-full rounded-2xl border border-slate-200 px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        >
          {dateOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Available times</label>
        {loadingSlots ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-slate-500">No slots available on this date. Try another.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s) => {
              const t = new Date(s.datetime);
              const label = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              const sel = selectedSlot === s.datetime;
              return (
                <button
                  type="button"
                  key={s.datetime}
                  onClick={() => setSelectedSlot(s.datetime)}
                  className={`px-2 py-2 text-sm rounded-2xl border ${
                    sel
                      ? 'bg-[var(--color-primary)] text-white border-transparent'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Your name</label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone (with country code)</label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91…"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Reason for visit (optional)</label>
        <textarea
          className="w-full rounded-2xl border border-slate-200 px-3 py-2"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !selectedSlot}
        className="w-full px-5 py-3 rounded-2xl text-white bg-[var(--color-primary)] disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Request Appointment'}
      </button>
    </form>
  );
}

function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return isoDate(d);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}
