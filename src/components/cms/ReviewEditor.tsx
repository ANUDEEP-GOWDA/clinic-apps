'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Review = {
  id?: number;
  source: string;
  author: string;
  rating: number;
  text: string;
  reviewedAt: string;
  featured: boolean;
  displayOrder: number;
};

const EMPTY: Review = {
  source: 'manual', author: '', rating: 5, text: '',
  reviewedAt: new Date().toISOString(), featured: false, displayOrder: 0,
};

export default function ReviewEditor({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState<Review | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  async function save(r: Review) {
    setBusy(true);
    try {
      const isNew = !r.id;
      const url = isNew ? '/api/cms/reviews' : `/api/cms/reviews/${r.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r),
      });
      if (res.ok) {
        setAdding(null);
        setEditing(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this review?')) return;
    await fetch(`/api/cms/reviews/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  async function syncGoogle() {
    setBusy(true);
    setSyncStatus('Syncing…');
    try {
      const res = await fetch('/api/cms/reviews/sync-google', { method: 'POST' });
      const j = (await res.json()) as { ok?: boolean; upserted?: number; error?: string };
      if (j.ok) {
        setSyncStatus(`Synced ${j.upserted ?? 0} reviews.`);
        router.refresh();
      } else {
        setSyncStatus(`Failed: ${j.error || 'unknown'}`);
      }
    } catch {
      setSyncStatus('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setAdding(EMPTY)}
          className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm"
        >
          + Add manual review
        </button>
        <button
          onClick={syncGoogle}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50"
        >
          Sync Google Reviews
        </button>
        {syncStatus ? <span className="self-center text-sm text-slate-600">{syncStatus}</span> : null}
      </div>

      {adding ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <Form value={adding} onChange={(v) => setAdding(v)} onSave={() => save(adding)} onCancel={() => setAdding(null)} busy={busy} />
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500">No reviews yet.</p>
      ) : (
        <ul className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100">
          {reviews.map((r) =>
            editing?.id === r.id ? (
              <li key={r.id} className="p-4">
                <Form value={editing!} onChange={(v) => setEditing(v)} onSave={() => editing && save(editing)} onCancel={() => setEditing(null)} busy={busy} />
              </li>
            ) : (
              <li key={r.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-amber-500 text-sm">{'★'.repeat(r.rating)}</div>
                  <p className="text-sm mt-1">{r.text}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    — {r.author} · {r.source}
                    {r.featured ? ' · ★ featured' : ''}
                  </p>
                </div>
                <div className="flex gap-2 text-sm shrink-0">
                  <button onClick={() => setEditing(r)} className="text-[var(--color-primary)] hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(r.id!)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function Form({
  value, onChange, onSave, onCancel, busy,
}: {
  value: Review;
  onChange: (v: Review) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const set = <K extends keyof Review>(k: K, v: Review[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <input className="input" placeholder="Author" value={value.author} onChange={(e) => set('author', e.target.value)} />
      <select className="input" value={value.rating} onChange={(e) => set('rating', Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
      </select>
      <textarea className="input sm:col-span-2" rows={3} placeholder="Review text" value={value.text} onChange={(e) => set('text', e.target.value)} />
      <input
        type="date"
        className="input"
        value={value.reviewedAt.slice(0, 10)}
        onChange={(e) => set('reviewedAt', new Date(e.target.value).toISOString())}
      />
      <input
        type="number"
        className="input"
        placeholder="Display order"
        value={value.displayOrder}
        onChange={(e) => set('displayOrder', Number(e.target.value) || 0)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.featured} onChange={(e) => set('featured', e.target.checked)} />
        Feature on homepage
      </label>
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={busy || !value.author || !value.text} onClick={onSave} className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm disabled:opacity-50">
          Save
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
          Cancel
        </button>
      </div>
      <style>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;background:white}`}</style>
    </div>
  );
}
