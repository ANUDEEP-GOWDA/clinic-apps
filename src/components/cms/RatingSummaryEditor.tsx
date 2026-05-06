'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RatingSummaryEditor({
  initial,
}: {
  initial: { rating: number; count: number };
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initial.rating);
  const [count, setCount] = useState(initial.count);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cms/site-content/google_rating_summary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: { rating: Number(rating) || 0, count: Number(count) || 0 } }),
      });
      if (res.ok) { setStatus('Saved.'); router.refresh(); }
      else setStatus('Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-3">
      <h2 className="font-medium">Google rating summary</h2>
      <p className="text-xs text-slate-500">Shown next to the Reviews section.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-slate-500 mb-1">Rating (e.g. 4.9)</span>
          <input
            type="number" step="0.1" min="0" max="5"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-slate-500 mb-1">Review count</span>
          <input
            type="number" min="0"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled={busy}
          onClick={save}
          className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
        >
          Save
        </button>
        {status ? <span className="text-sm text-slate-600">{status}</span> : null}
      </div>
    </div>
  );
}
