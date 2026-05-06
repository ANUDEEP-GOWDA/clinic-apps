'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StringListEditor({
  storageKey,
  initial,
  label,
}: {
  storageKey: string;
  initial: string[];
  label: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function update(i: number, v: string) {
    setItems((p) => p.map((x, j) => (i === j ? v : x)));
  }
  function remove(i: number) {
    setItems((p) => p.filter((_, j) => j !== i));
  }
  function add() {
    setItems((p) => [...p, '']);
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/cms/site-content/${storageKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: items.filter((x) => x.trim()) }),
      });
      if (res.ok) {
        setStatus('Saved.');
        router.refresh();
      } else {
        setStatus('Save failed.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-3">
      <h2 className="font-medium">{label}</h2>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              value={it}
              onChange={(e) => update(i, e.target.value)}
            />
            <button onClick={() => remove(i)} className="text-xs text-red-600 hover:underline">
              remove
            </button>
          </li>
        ))}
      </ul>
      <button onClick={add} className="text-sm text-[var(--color-primary)] hover:underline">
        + Add
      </button>
      <div className="flex gap-3 items-center">
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
