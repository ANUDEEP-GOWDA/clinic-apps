'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Init = { title: string; description: string; keywords: string };

export default function SeoEditor({
  initial,
  suggestions,
}: {
  initial: Init;
  suggestions: Init;
}) {
  const router = useRouter();
  const [v, setV] = useState<Init>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function saveOne(key: string, value: string) {
    await fetch(`/api/cms/site-content/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      await Promise.all([
        saveOne('seo_default_title', v.title),
        saveOne('seo_default_description', v.description),
        saveOne('seo_keywords', v.keywords),
      ]);
      setStatus('Saved.');
      router.refresh();
    } catch {
      setStatus('Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Field
        label="Page title"
        value={v.title}
        onChange={(x) => setV({ ...v, title: x })}
        suggestion={suggestions.title}
        onUseSuggestion={() => setV({ ...v, title: suggestions.title })}
      />
      <Field
        label="Meta description"
        value={v.description}
        onChange={(x) => setV({ ...v, description: x })}
        suggestion={suggestions.description}
        onUseSuggestion={() => setV({ ...v, description: suggestions.description })}
        textarea
      />
      <Field
        label="Keywords (comma-separated)"
        value={v.keywords}
        onChange={(x) => setV({ ...v, keywords: x })}
        suggestion={suggestions.keywords}
        onUseSuggestion={() => setV({ ...v, keywords: suggestions.keywords })}
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
      <p className="text-xs text-slate-500">
        Empty fields auto-fall-back to suggestions on the live site.
      </p>
    </div>
  );
}

function Field({
  label, value, onChange, suggestion, onUseSuggestion, textarea,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  suggestion?: string;
  onUseSuggestion?: () => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
        />
      )}
      {suggestion && suggestion !== value ? (
        <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-2 items-start">
          <span>Suggestion: {suggestion}</span>
          <button
            type="button"
            onClick={onUseSuggestion}
            className="text-[var(--color-primary)] hover:underline"
          >
            Use suggestion
          </button>
        </div>
      ) : null}
    </div>
  );
}
