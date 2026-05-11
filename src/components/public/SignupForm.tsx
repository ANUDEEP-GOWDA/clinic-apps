'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ERROR_MESSAGES: Record<string, string> = {
  clinic_name_required: 'Clinic name is required.',
  owner_name_required: 'Your name is required.',
  invalid_email: 'Please enter a valid email.',
  email_taken: 'An account with this email already exists.',
  password_too_short: 'Password must be at least 8 characters.',
  password_too_long: 'Password is too long.',
  password_no_uppercase: 'Password must include at least one uppercase letter.',
  password_no_number: 'Password must include at least one number.',
  password_too_common: 'Password is too common. Choose something less guessable.',
  invalid_invite: 'Invalid invite code.',
  rate_limited: 'Too many attempts. Please wait a minute.',
};

export default function SignupForm() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (ownerPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const idem = (() => {
        try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random()}`; }
      })();
      const res = await fetch('/api/public/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idem },
        body: JSON.stringify({
          clinicName: clinicName.trim(),
          ownerName: ownerName.trim(),
          ownerEmail: ownerEmail.trim().toLowerCase(),
          ownerPassword,
          inviteCode: inviteCode.trim() || undefined,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; loginAt?: string };
      if (!res.ok || !j.ok) {
        setError(ERROR_MESSAGES[j.error ?? ''] ?? j.error ?? 'Something went wrong.');
        return;
      }
      router.push(j.loginAt ?? '/cms/login');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Clinic name">
        <input required value={clinicName} onChange={(e) => setClinicName(e.target.value)}
          className="input" placeholder="e.g. Sunshine Family Clinic" />
      </Field>

      <hr className="border-slate-200 my-2" />

      <Field label="Your name">
        <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
          className="input" />
      </Field>

      <Field label="Email">
        <input required type="email" value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          className="input" autoComplete="email" />
      </Field>

      <Field label="Password" hint="At least 8 characters, one uppercase letter, one number.">
        <div className="relative">
          <input required type={showPassword ? 'text' : 'password'}
            value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)}
            className="input pr-12" minLength={8} autoComplete="new-password" />
          <button type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700">
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </Field>

      <Field label="Confirm password">
        <input required type={showPassword ? 'text' : 'password'}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className="input" minLength={8} autoComplete="new-password" />
      </Field>

      <Field label="Invite code" hint="Leave blank if you weren't given one.">
        <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="input" />
      </Field>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting}
        className="w-full rounded-lg bg-slate-900 text-white font-medium py-3 hover:bg-slate-800 disabled:opacity-50">
        {submitting ? 'Creating…' : 'Create clinic'}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          padding: 0.625rem 0.75rem;
          font-size: 0.95rem;
          background: white;
        }
        .input:focus {
          outline: 2px solid #0f172a22;
          border-color: #0f172a;
        }
      `}</style>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
