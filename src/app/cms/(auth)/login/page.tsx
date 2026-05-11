'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const ERRORS: Record<string, string> = {
  invalid_credentials: 'Wrong email or password.',
  inactive: 'This account is inactive. Contact your clinic owner.',
  locked: 'Too many failed attempts. Try again in 15 minutes.',
  rate_limited: 'Too many attempts. Slow down.',
  invalid_request: 'Please fill all fields.',
};

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/cms/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/cms/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; requiresMfa?: boolean };
      if (!res.ok || !j.ok) {
        setError(ERRORS[j.error ?? ''] ?? 'Login failed.');
        return;
      }
      if (j.requiresMfa) {
        setError('Multi-factor auth not yet implemented for this account.');
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to manage your clinic.</p>
        <div className="mt-6 space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 pr-14" required />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={busy}
            className="w-full px-4 py-2 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-500">
          <Link href="/signup" className="underline">Create a clinic</Link>
          <Link href="/forgot-password" className="underline">Forgot password?</Link>
        </div>
      </form>
    </main>
  );
}
