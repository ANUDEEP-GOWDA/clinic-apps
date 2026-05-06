'use client';

import { useState } from 'react';

export default function CallRequestForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/call-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          preferredTime,
          message,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'Failed.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className="text-sm text-emerald-700">Thanks — we&apos;ll call you back soon.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="w-full rounded-2xl border border-slate-200 px-3 py-2"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full rounded-2xl border border-slate-200 px-3 py-2"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        className="w-full rounded-2xl border border-slate-200 px-3 py-2"
        placeholder="Preferred time (optional)"
        value={preferredTime}
        onChange={(e) => setPreferredTime(e.target.value)}
      />
      <textarea
        className="w-full rounded-2xl border border-slate-200 px-3 py-2"
        rows={3}
        placeholder="Message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2 rounded-2xl text-white bg-[var(--color-primary)] disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Request Callback'}
      </button>
    </form>
  );
}
