'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const params = useSearchParams();
  const success = params.get('success') === '1';
  const error = params.get('error');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch('/api/public/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setBusy(false);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Email verified!</h1>
        <p className="mt-2 text-sm text-slate-500">Your email has been confirmed. You can now sign in.</p>
        <Link href="/cms/login"
          className="mt-6 inline-block px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm hover:bg-slate-800">
          Sign in
        </Link>
      </div>
    );
  }

  if (error) {
    const msg = error === 'missing_token'
      ? 'The verification link is incomplete.'
      : 'This verification link has expired or already been used.';
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Verification failed</h1>
        <p className="mt-2 text-sm text-slate-500">{msg}</p>
        <p className="mt-4 text-sm text-slate-500">Need a new link?</p>
        {sent ? (
          <p className="mt-2 text-sm text-green-600 font-medium">Check your inbox — we sent a new link.</p>
        ) : (
          <form onSubmit={resend} className="mt-3 flex gap-2 justify-center">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-56" />
            <button type="submit" disabled={busy}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-50">
              {busy ? '…' : 'Resend'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Default: just landed here (e.g. from signup success redirect)
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-slate-900">Account created!</h1>
      <p className="mt-2 text-sm text-slate-500">
        We sent a verification link to your email. You can verify later — you&apos;re ready to sign in now.
      </p>
      <Link href="/cms/login"
        className="mt-5 inline-block w-full px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800">
        Sign in to your dashboard
      </Link>
      <p className="mt-5 text-xs text-slate-400">Didn&apos;t get the email? Check spam, or resend:</p>
      {sent ? (
        <p className="mt-2 text-sm text-green-600 font-medium">Resent! Check your inbox again.</p>
      ) : (
        <form onSubmit={resend} className="mt-3 flex gap-2 justify-center">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com" required
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-56" />
          <button type="submit" disabled={busy}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm disabled:opacity-50 hover:bg-slate-200">
            {busy ? '…' : 'Resend'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <Suspense>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  );
}
