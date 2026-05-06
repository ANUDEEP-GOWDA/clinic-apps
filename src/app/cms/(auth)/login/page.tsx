'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const ERRORS: Record<string, string> = {
  invalid_credentials: 'Wrong clinic, email, or password.',
  inactive: 'This account is inactive. Contact your clinic owner.',
  locked: 'Too many failed attempts. Try again in 15 minutes.',
  rate_limited: 'Too many attempts. Slow down.',
  invalid_request: 'Please fill all fields.',
};

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/cms/dashboard';

  const [clinicSlug, setClinicSlug] = useState(search.get('clinic') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({
          clinicSlug: clinicSlug.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        error?: string;
        requiresMfa?: boolean;
      };
      if (!res.ok || !j.ok) {
        setError(ERRORS[j.error ?? ''] ?? 'Login failed.');
        return;
      }
      if (j.requiresMfa) {
        // TODO: navigate to /cms/mfa once that flow is wired.
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
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
      >
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sign in to manage your clinic.
        </p>
        <div className="mt-6 space-y-3">
          <div>
            <label className="block text-sm mb-1">Clinic slug</label>
            <input
              autoComplete="organization"
              value={clinicSlug}
              onChange={(e) => setClinicSlug(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              placeholder="your-clinic"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          New here? <a href="/signup" className="underline">Create a clinic</a>.
        </p>
      </form>
    </main>
  );
}
