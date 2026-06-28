'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const LOGIN_ERRORS: Record<string, string> = {
  invalid_credentials: 'Wrong email or password.',
  inactive: 'This account is inactive. Contact your clinic owner.',
  locked: 'Too many failed attempts. Try again in 15 minutes.',
  rate_limited: 'Too many attempts. Slow down.',
  invalid_request: 'Please fill all fields.',
};

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/cms/dashboard';
  const fromSignup = search.get('from') === 'signup';

  const [step, setStep] = useState<'password' | 'mfa'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPassword(e: React.FormEvent) {
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
        setError(LOGIN_ERRORS[j.error ?? ''] ?? 'Login failed.');
        return;
      }
      if (j.requiresMfa) {
        setStep('mfa');
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

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/cms/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode.replace(/\s/g, '') }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setError(j.error === 'invalid_code' ? 'Incorrect code. Try again.' : 'Verification failed.');
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

  if (step === 'mfa') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <form onSubmit={submitMfa}
          className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={() => { setStep('password'); setMfaCode(''); setError(null); }}
              className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold">Two-factor authentication</h1>
              <p className="text-sm text-slate-500">Enter the 6-digit code from your authenticator app.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-center text-2xl tracking-widest font-mono"
              autoFocus
              required
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" disabled={busy || mfaCode.length !== 6}
              className="w-full px-4 py-2 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">
              {busy ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form onSubmit={submitPassword}
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {fromSignup && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            Account created! Sign in to get started.
          </div>
        )}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
