'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TEMPLATES = [
  {
    id: 'classic',
    name: 'Clean Minimal',
    desc: 'A light, structured layout with stacked sections. Simple, professional, and easy to read.',
    color: '#1e293b',
  },
  {
    id: 'voldog',
    name: 'Bold Editorial',
    desc: 'Floating hero card with scroll-driven brand animation, frosted navbar, and a premium dark-tone feel.',
    color: '#2d4700',
  },
  {
    id: 'likha',
    name: 'Aesthetic Rose',
    desc: 'Luxury aesthetic template with a warm beige/rose-gold gradient, premium typography, and an immersive fullscreen overlay menu.',
    color: '#D19B8E',
  },
];

export default function TemplateSelector({ current }: { current: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(current || 'classic');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save(templateId: string) {
    setSelected(templateId);
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTemplate: templateId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus('Template saved.');
        router.refresh();
      } else {
        console.error('Template save failed:', res.status, data);
        setStatus(`Failed to save. (${res.status}: ${JSON.stringify(data)})`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        {TEMPLATES.map((t) => {
          const isActive = selected === t.id;
          return (
            <button
              key={t.id}
              disabled={busy}
              onClick={() => save(t.id)}
              className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-lg disabled:opacity-60 ${
                isActive
                  ? 'border-[var(--color-primary)] bg-blue-50/50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Color preview bar */}
              <div
                className="w-full h-24 rounded-xl mb-4 relative overflow-hidden"
                style={{ backgroundColor: t.color }}
              >
                {/* Mini mockup */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-white/20 font-black text-3xl uppercase tracking-tight select-none"
                    style={{ fontFamily: t.id === 'voldog' ? "'DM Sans', sans-serif" : 'inherit' }}
                  >
                    {t.name}
                  </span>
                </div>
                {/* Active checkmark */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7L6 10L11 4" stroke={t.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-base mb-1">{t.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
            </button>
          );
        })}
      </div>

      {status && (
        <p className="mt-3 text-sm text-slate-600">{status}</p>
      )}
    </div>
  );
}
