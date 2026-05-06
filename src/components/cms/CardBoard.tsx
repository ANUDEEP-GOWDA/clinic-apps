'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type CardLite = {
  id: number;
  type: string;
  state: string;
  patientName: string;
  doctorName: string;
  doctorId: number;
  slotDatetime: string | null;
  reasonForVisit: string;
  patientConfirmedAt: string | null;
};

type Props = {
  requests: CardLite[];
  appointments: CardLite[];
  consultations: CardLite[];
  doctors: Array<{ id: number; name: string }>;
};

export default function CardBoard({ requests, appointments, consultations, doctors }: Props) {
  const [doctorFilter, setDoctorFilter] = useState<number | 'all'>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  function filter(cards: CardLite[]) {
    return cards.filter((c) => {
      if (doctorFilter !== 'all' && c.doctorId !== doctorFilter) return false;
      if (from && c.slotDatetime && c.slotDatetime < `${from}T00:00:00.000Z`) return false;
      if (to && c.slotDatetime && c.slotDatetime > `${to}T23:59:59.999Z`) return false;
      return true;
    });
  }

  const r = useMemo(() => filter(requests), [requests, doctorFilter, from, to]);
  const a = useMemo(() => filter(appointments), [appointments, doctorFilter, from, to]);
  const c = useMemo(() => filter(consultations), [consultations, doctorFilter, from, to]);

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Doctor</label>
          <select
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <input
            type="date"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <input
            type="date"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Column title={`Requests (${r.length})`} cards={r} accent="bg-amber-50 border-amber-100" />
        <Column title={`Appointments (${a.length})`} cards={a} accent="bg-blue-50 border-blue-100" />
        <Column title={`Consultations (${c.length})`} cards={c} accent="bg-emerald-50 border-emerald-100" />
      </div>
    </>
  );
}

function Column({ title, cards, accent }: { title: string; cards: CardLite[]; accent: string }) {
  return (
    <div className={`rounded-2xl border ${accent} p-3`}>
      <h2 className="text-sm font-semibold mb-3 px-1">{title}</h2>
      <div className="space-y-2">
        {cards.length === 0 ? (
          <p className="text-xs text-slate-500 px-1">Nothing here.</p>
        ) : (
          cards.map((c) => <CardItem key={c.id} card={c} />)
        )}
      </div>
    </div>
  );
}

function CardItem({ card }: { card: CardLite }) {
  const when = card.slotDatetime
    ? new Date(card.slotDatetime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
  return (
    <Link
      href={`/cms/cards/${card.id}`}
      className="block bg-white rounded-xl border border-slate-100 px-3 py-2.5 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm">{card.patientName}</div>
        {card.patientConfirmedAt ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            confirmed
          </span>
        ) : null}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{card.doctorName}</div>
      <div className="text-xs text-slate-700 mt-1">{when}</div>
      {card.reasonForVisit ? (
        <div className="text-xs text-slate-500 mt-1 line-clamp-1">{card.reasonForVisit}</div>
      ) : null}
    </Link>
  );
}
