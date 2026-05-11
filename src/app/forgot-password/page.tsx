'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch('/api/public/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show success — we never reveal whether the email exists.
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-slate-600 mt-2">
            If an account exists for that email, we just sent a password reset link. It expires in 1 hour.
          </p>
          <Link href="/cms/login" className="mt-6 inline-block text-sm underline">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <p className="text-sm text-slate-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <input type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2"
          placeholder="you@example.com" />
        <button type="submit" disabled={busy}
          className="w-full px-4 py-2 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
        <Link href="/cms/login" className="block text-xs text-slate-500 underline text-center">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
