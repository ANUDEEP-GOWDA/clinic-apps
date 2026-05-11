'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/public/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setError(j.error === 'invalid_token' ? 'This link is invalid or expired.' : (j.error ?? 'Failed.'));
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/cms/login'), 2000);
    } finally { setBusy(false); }
  }

  if (done) return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
        <h1 className="text-xl font-semibold">Password reset.</h1>
        <p className="text-sm text-slate-500 mt-2">Redirecting to sign-in…</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <p className="text-xs text-slate-500">At least 8 characters, one uppercase, one number.</p>
        <div className="relative">
          <input required type={show ? 'text' : 'password'} placeholder="New password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 pr-14" minLength={8} />
          <button type="button" onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <input required type={show ? 'text' : 'password'} placeholder="Confirm new password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2" minLength={8} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy || !token}
          className="w-full px-4 py-2 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">
          {busy ? 'Saving…' : 'Set password'}
        </button>
        <Link href="/cms/login" className="block text-xs text-slate-500 underline text-center">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
