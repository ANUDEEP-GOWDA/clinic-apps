'use client';

import { useState } from 'react';

type Props = {
  mfaEnabled: boolean;
  emailVerified: boolean;
  email: string;
};

export default function AccountSecurity({ mfaEnabled: initialMfaEnabled, emailVerified, email }: Props) {
  const [mfaEnabled, setMfaEnabled] = useState(initialMfaEnabled);

  return (
    <div className="space-y-6 max-w-2xl">
      <EmailVerificationCard emailVerified={emailVerified} email={email} />
      <MfaCard mfaEnabled={mfaEnabled} onToggle={setMfaEnabled} />
    </div>
  );
}

// ── Email Verification ────────────────────────────────────────────────────────

function EmailVerificationCard({ emailVerified, email }: { emailVerified: boolean; email: string }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    await fetch('/api/public/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium text-slate-900">Email verification</h2>
          <p className="text-sm text-slate-500 mt-0.5">{email}</p>
        </div>
        {emailVerified ? (
          <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            Not verified
          </span>
        )}
      </div>
      {!emailVerified && (
        <div className="mt-4">
          {sent ? (
            <p className="text-sm text-green-700">Verification email sent — check your inbox.</p>
          ) : (
            <button onClick={resend} disabled={busy}
              className="text-sm px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
              {busy ? 'Sending…' : 'Resend verification email'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── MFA Setup ─────────────────────────────────────────────────────────────────

type MfaStep = 'idle' | 'setup' | 'disable';

function MfaCard({ mfaEnabled, onToggle }: { mfaEnabled: boolean; onToggle: (v: boolean) => void }) {
  const [step, setStep] = useState<MfaStep>('idle');
  const [secret, setSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/cms/auth/mfa/setup', { method: 'POST' });
      const j = (await res.json()) as { secret?: string; qrDataUrl?: string };
      if (!j.secret || !j.qrDataUrl) { setError('Failed to start setup.'); return; }
      setSecret(j.secret);
      setQrDataUrl(j.qrDataUrl);
      setCode('');
      setStep('setup');
    } catch { setError('Network error.'); }
    finally { setBusy(false); }
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/cms/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!j.ok) { setError(j.error === 'invalid_code' ? 'Incorrect code.' : 'Failed to enable.'); return; }
      onToggle(true);
      setStep('idle');
      setSecret('');
      setQrDataUrl('');
      setCode('');
    } catch { setError('Network error.'); }
    finally { setBusy(false); }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/cms/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!j.ok) { setError(j.error === 'invalid_code' ? 'Incorrect code.' : 'Failed to disable.'); return; }
      onToggle(false);
      setStep('idle');
      setCode('');
    } catch { setError('Network error.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium text-slate-900">Two-factor authentication</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {mfaEnabled
              ? 'Your account is protected with an authenticator app.'
              : 'Add an extra layer of security to your account.'}
          </p>
        </div>
        <span className={`text-sm rounded-full px-3 py-1 shrink-0 font-medium ${
          mfaEnabled ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
        }`}>
          {mfaEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {step === 'idle' && (
        <div className="mt-4">
          {mfaEnabled ? (
            <button onClick={() => { setStep('disable'); setCode(''); setError(null); }}
              className="text-sm px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50">
              Disable 2FA
            </button>
          ) : (
            <button onClick={startSetup} disabled={busy}
              className="text-sm px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
              {busy ? 'Loading…' : 'Set up 2FA'}
            </button>
          )}
        </div>
      )}

      {step === 'setup' && (
        <form onSubmit={confirmEnable} className="mt-5 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              1. Scan this QR code with Google Authenticator, Authy, or any TOTP app.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code" className="w-44 h-44 rounded-xl border border-slate-200" />
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer select-none">Can&apos;t scan? Enter manually</summary>
              <code className="block mt-1 bg-slate-50 px-2 py-1 rounded text-xs break-all">{secret}</code>
            </details>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">2. Enter the 6-digit code from the app to confirm.</p>
            <input type="text" inputMode="numeric" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-36 rounded-xl border border-slate-200 px-3 py-2 text-center font-mono text-lg tracking-widest"
              autoFocus required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy || code.length !== 6}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-50">
              {busy ? 'Enabling…' : 'Enable 2FA'}
            </button>
            <button type="button" onClick={() => { setStep('idle'); setError(null); }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {step === 'disable' && (
        <form onSubmit={confirmDisable} className="mt-5 space-y-3">
          <p className="text-sm text-slate-700">
            Enter the 6-digit code from your authenticator app to confirm.
          </p>
          <input type="text" inputMode="numeric" maxLength={6} value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-36 rounded-xl border border-slate-200 px-3 py-2 text-center font-mono text-lg tracking-widest"
            autoFocus required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy || code.length !== 6}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm disabled:opacity-50">
              {busy ? 'Disabling…' : 'Disable 2FA'}
            </button>
            <button type="button" onClick={() => { setStep('idle'); setError(null); }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
