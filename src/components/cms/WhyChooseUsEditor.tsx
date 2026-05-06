'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Item = { icon: string; title: string; description: string };

const EMPTY: Item = { icon: '', title: '', description: '' };

export default function WhyChooseUsEditor({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial.length ? initial : []);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function update(i: number, patch: Partial<Item>) {
    setItems((p) => p.map((x, j) => (i === j ? { ...x, ...patch } : x)));
  }
  function remove(i: number) {
    setItems((p) => p.filter((_, j) => j !== i));
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cms/site-content/why_choose_us', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: items.filter((x) => x.title.trim()) }),
      });
      if (res.ok) { setStatus('Saved.'); router.refresh(); }
      else setStatus('Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-3">
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="bg-white border border-slate-100 rounded-2xl p-4 grid sm:grid-cols-12 gap-2">
            <input
              className="input sm:col-span-2"
              placeholder="Icon (emoji)"
              value={it.icon}
              onChange={(e) => update(i, { icon: e.target.value })}
            />
            <input
              className="input sm:col-span-4"
              placeholder="Title"
              value={it.title}
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <input
              className="input sm:col-span-5"
              placeholder="Description"
              value={it.description}
              onChange={(e) => update(i, { description: e.target.value })}
            />
            <button
              onClick={() => remove(i)}
              className="text-xs text-red-600 hover:underline sm:col-span-1"
            >
              remove
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setItems((p) => [...p, EMPTY])}
        className="text-sm text-[var(--color-primary)] hover:underline"
      >
        + Add item
      </button>
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
      <style>{`.input{border:1px solid #e2e8f0;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;background:white}`}</style>
    </div>
  );
}
