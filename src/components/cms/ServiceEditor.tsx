'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Service = {
  id?: number;
  name: string;
  description: string;
  icon: string;
  durationMin: number;
  displayOrder: number;
  active: boolean;
};

const EMPTY: Service = {
  name: '', description: '', icon: '', durationMin: 15, displayOrder: 0, active: true,
};

export default function ServiceEditor({ services }: { services: Service[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState<Service | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(s: Service) {
    setBusy(true);
    setError(null);
    try {
      const isNew = !s.id;
      const url = isNew ? '/api/cms/services' : `/api/cms/services/${s.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'Save failed.');
      } else {
        setAdding(null);
        setEditing(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Deactivate this service?')) return;
    await fetch(`/api/cms/services/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {services.length === 0 ? (
        <p className="text-sm text-slate-500">No services yet.</p>
      ) : (
        <ul className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100">
          {services.map((s) =>
            editing?.id === s.id ? (
              <li key={s.id} className="p-4">
                <Form
                  value={editing!}
                  onChange={(v) => setEditing(v)}
                  onSave={() => editing && save(editing)}
                  onCancel={() => setEditing(null)}
                  busy={busy}
                />
              </li>
            ) : (
              <li key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    <span className="mr-2">{s.icon || '🩺'}</span>
                    {s.name}
                    {!s.active ? <span className="ml-2 text-xs text-slate-400">(inactive)</span> : null}
                  </div>
                  {s.description ? (
                    <div className="text-sm text-slate-500">{s.description}</div>
                  ) : null}
                  <div className="text-xs text-slate-500">
                    {s.durationMin} min · order {s.displayOrder}
                  </div>
                </div>
                <div className="flex gap-2 text-sm">
                  <button onClick={() => setEditing(s)} className="text-[var(--color-primary)] hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(s.id!)} className="text-red-600 hover:underline">
                    Deactivate
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {adding ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <Form
            value={adding}
            onChange={(v) => setAdding(v)}
            onSave={() => save(adding)}
            onCancel={() => setAdding(null)}
            busy={busy}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(EMPTY)}
          className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm"
        >
          + Add service
        </button>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function Form({
  value, onChange, onSave, onCancel, busy,
}: {
  value: Service;
  onChange: (v: Service) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const set = <K extends keyof Service>(k: K, v: Service[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <input className="input" placeholder="Name" value={value.name} onChange={(e) => set('name', e.target.value)} />
      <input className="input" placeholder="Icon (emoji)" value={value.icon} onChange={(e) => set('icon', e.target.value)} />
      <input className="input sm:col-span-2" placeholder="Description" value={value.description} onChange={(e) => set('description', e.target.value)} />
      <input type="number" className="input" placeholder="Duration (min)" value={value.durationMin} onChange={(e) => set('durationMin', Number(e.target.value) || 15)} />
      <input type="number" className="input" placeholder="Display order" value={value.displayOrder} onChange={(e) => set('displayOrder', Number(e.target.value) || 0)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.active} onChange={(e) => set('active', e.target.checked)} />
        Active
      </label>
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={busy || !value.name} onClick={onSave} className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm disabled:opacity-50">
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
