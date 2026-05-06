'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FAQ = { question: string; answer: string };

export default function FaqEditor({ initial }: { initial: FAQ[] }) {
  const router = useRouter();
  const [items, setItems] = useState<FAQ[]>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function update(i: number, patch: Partial<FAQ>) {
    setItems((p) => p.map((x, j) => (i === j ? { ...x, ...patch } : x)));
  }
  function remove(i: number) {
    setItems((p) => p.filter((_, j) => j !== i));
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cms/site-content/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: items.filter((x) => x.question.trim()) }),
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
          <li key={i} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
            <input
              className="input"
              placeholder="Question"
              value={it.question}
              onChange={(e) => update(i, { question: e.target.value })}
            />
            <textarea
              className="input"
              rows={3}
              placeholder="Answer"
              value={it.answer}
              onChange={(e) => update(i, { answer: e.target.value })}
            />
            <button onClick={() => remove(i)} className="text-xs text-red-600 hover:underline">
              remove
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setItems((p) => [...p, { question: '', answer: '' }])}
        className="text-sm text-[var(--color-primary)] hover:underline"
      >
        + Add FAQ
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
      <style>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;background:white}`}</style>
    </div>
  );
}
