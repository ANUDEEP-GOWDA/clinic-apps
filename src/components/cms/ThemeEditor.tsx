'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ThemeConfig } from '@/lib/theme';

export default function ThemeEditor({ initial }: { initial: ThemeConfig }) {
  const router = useRouter();
  const [t, setT] = useState<ThemeConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function set<K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) {
    setT((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeConfig: JSON.stringify(t) }),
      });
      if (res.ok) { setStatus('Saved.'); router.refresh(); }
      else setStatus('Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <ColorField label="Primary" value={t.primary} onChange={(v) => set('primary', v)} />
        <ColorField label="Secondary" value={t.secondary} onChange={(v) => set('secondary', v)} />
        <ColorField label="Accent" value={t.accent} onChange={(v) => set('accent', v)} />
        <ColorField label="Background" value={t.background} onChange={(v) => set('background', v)} />
        <ColorField label="Foreground (text)" value={t.foreground} onChange={(v) => set('foreground', v)} />
        <label className="block">
          <span className="block text-xs text-slate-500 mb-1">Font family</span>
          <input
            value={t.fontFamily}
            onChange={(e) => set('fontFamily', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          />
        </label>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <h3 className="text-sm font-medium mb-2">Preview</h3>
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: t.background, color: t.foreground }}
        >
          <button
            className="px-3 py-1.5 rounded-xl text-white text-sm"
            style={{ background: t.primary }}
          >
            Primary button
          </button>
          <button
            className="px-3 py-1.5 rounded-xl text-white text-sm"
            style={{ background: t.secondary }}
          >
            Secondary
          </button>
          <span className="text-sm" style={{ color: t.accent }}>
            Accent text
          </span>
        </div>
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded border border-slate-200" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" />
      </div>
    </label>
  );
}
