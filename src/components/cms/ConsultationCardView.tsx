'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CardViewModel } from './card-view-types';

type Props = {
  card: CardViewModel;
  consultation: { notes: string; sentMessage: string };
  attachments: Array<{ id: number; filename: string; path: string; sizeBytes: number }>;
};

export default function ConsultationCardView({ card, consultation, attachments }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(consultation.notes);
  const [sentMsg, setSentMsg] = useState(consultation.sentMessage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAt, setFollowUpAt] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');

  async function save(opts: { finalize?: boolean } = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cms/cards/${card.id}/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, sentMessage: sentMsg, finalize: !!opts.finalize }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) setError(j.error || 'Save failed.');
      else router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function sendToPatient() {
    setSendStatus(null);
    if (!sentMsg.trim()) {
      setSendStatus('Nothing to send.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/cms/cards/${card.id}/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, sentMessage: sentMsg, sendToPatient: true }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; sent?: boolean };
      if (!res.ok || !j.ok) setSendStatus(j.error || 'Send failed.');
      else setSendStatus(j.sent ? 'Message sent.' : 'Saved (send failed; check WhatsApp config).');
    } catch {
      setSendStatus('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/cms/cards/${card.id}/attachments`, {
      method: 'POST',
      body: fd,
    });
    if (res.ok) router.refresh();
  }

  async function createFollowUp() {
    if (!followUpAt) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cms/cards/${card.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUp: {
            slotDatetime: new Date(followUpAt).toISOString(),
            reasonForVisit: followUpReason,
          },
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; cardId?: number };
      if (!res.ok || !j.ok) setError(j.error || 'Failed.');
      else if (j.cardId) router.push(`/cms/cards/${j.cardId}`);
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  const completed = card.state === 'completed';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Consultation</h2>
        <p className="text-sm text-slate-500">
          {card.patient.name} · {card.doctor.name} ·{' '}
          {card.slotDatetime ? new Date(card.slotDatetime).toLocaleString() : '—'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Private notes</label>
        <textarea
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={completed}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Examination, diagnosis, plan…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Message to send patient</label>
        <textarea
          rows={4}
          value={sentMsg}
          onChange={(e) => setSentMsg(e.target.value)}
          disabled={completed}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Plain text — will be sent via WhatsApp."
        />
        <div className="flex gap-2 mt-2">
          <button
            disabled={busy || completed}
            onClick={() => save()}
            className="px-3 py-1.5 text-sm rounded-xl border border-slate-200"
          >
            Save
          </button>
          <button
            disabled={busy || completed}
            onClick={sendToPatient}
            className="px-3 py-1.5 text-sm rounded-xl bg-[var(--color-primary)] text-white disabled:opacity-50"
          >
            Send to Patient
          </button>
          {sendStatus ? <span className="text-sm text-slate-600">{sendStatus}</span> : null}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Attachments</label>
        <input
          type="file"
          disabled={completed}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
          }}
          className="text-sm"
        />
        <ul className="mt-2 space-y-1 text-sm">
          {attachments.length === 0 ? (
            <li className="text-slate-500">None.</li>
          ) : (
            attachments.map((a) => (
              <li key={a.id}>
                <a href={a.path} target="_blank" rel="noopener" className="text-[var(--color-primary)] hover:underline">
                  {a.filename}
                </a>{' '}
                <span className="text-xs text-slate-500">({Math.round(a.sizeBytes / 1024)} KB)</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {!completed ? (
          <>
            <button
              disabled={busy}
              onClick={() => save({ finalize: true })}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
            >
              Finalize
            </button>
            <button
              onClick={() => setShowFollowUp((v) => !v)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
            >
              {showFollowUp ? 'Hide follow-up' : 'Schedule Follow-Up'}
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-emerald-700">✓ Completed.</span>
            <button
              onClick={() => setShowFollowUp((v) => !v)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
            >
              {showFollowUp ? 'Hide follow-up' : 'Schedule Follow-Up'}
            </button>
          </>
        )}
      </div>

      {showFollowUp ? (
        <div className="rounded-xl border border-slate-100 p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Follow-up date/time</label>
              <input
                type="datetime-local"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-full"
                value={followUpAt}
                onChange={(e) => setFollowUpAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Reason</label>
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-full"
                value={followUpReason}
                onChange={(e) => setFollowUpReason(e.target.value)}
              />
            </div>
          </div>
          <button
            disabled={busy || !followUpAt}
            onClick={createFollowUp}
            className="px-3 py-1.5 text-sm rounded-xl bg-[var(--color-primary)] text-white disabled:opacity-50"
          >
            Create follow-up request
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
