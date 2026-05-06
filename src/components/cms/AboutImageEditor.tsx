'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AboutImageEditor({ initial }: { initial: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cms/site-content/about_image_url', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: v }),
      });
      if (res.ok) { setStatus('Saved.'); router.refresh(); }
      else setStatus('Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-2">
      <h2 className="font-medium">About image URL</h2>
      <input
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="https://… or /uploads/…"
      />
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
