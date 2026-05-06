'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ERROR_MESSAGES: Record<string, string> = {
  clinic_name_required: 'Clinic name is required.',
  invalid_slug:
    'Slug must be lowercase letters, numbers, and dashes (3–32 chars), starting and ending with a letter or number.',
  reserved_slug: 'That slug is reserved. Pick another.',
  slug_taken: 'That slug is already taken.',
  owner_name_required: 'Your name is required.',
  invalid_email: 'Please enter a valid email.',
  password_too_short: 'Password must be at least 10 characters.',
  password_too_long: 'Password is too long.',
  invalid_invite: 'Invalid invite code.',
  rate_limited: 'Too many attempts. Please wait a minute.',
};

export default function SignupForm() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState('');
  const [clinicSlug, setClinicSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-suggest slug from clinic name
  function onClinicNameChange(v: string) {
    setClinicName(v);
    if (!clinicSlug) {
      const auto = v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32);
      setClinicSlug(auto);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const idem = (() => {
        try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random()}`; }
      })();
      const res = await fetch('/api/public/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idem,
        },
        body: JSON.stringify({
          clinicName: clinicName.trim(),
          clinicSlug: clinicSlug.trim().toLowerCase(),
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
        <input
          required
          value={clinicName}
          onChange={(e) => onClinicNameChange(e.target.value)}
          className="input"
          placeholder="e.g. Sunshine Family Clinic"
        />
      </Field>

      <Field
        label="Clinic URL slug"
        hint="Used in your public URL: yourdomain.com/c/your-slug"
      >
        <input
          required
          value={clinicSlug}
          onChange={(e) => setClinicSlug(e.target.value)}
          className="input"
          placeholder="sunshine-family"
          pattern="^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$"
        />
      </Field>

      <hr className="border-slate-200 my-2" />

      <Field label="Your name">
        <input
          required
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Email">
        <input
          required
          type="email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          className="input"
          autoComplete="email"
        />
      </Field>

      <Field label="Password" hint="At least 10 characters.">
        <input
          required
          type="password"
          value={ownerPassword}
          onChange={(e) => setOwnerPassword(e.target.value)}
          className="input"
          minLength={10}
          autoComplete="new-password"
        />
      </Field>

      <Field label="Invite code" hint="Leave blank if you weren't given one.">
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="input"
        />
      </Field>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-slate-900 text-white font-medium py-3 hover:bg-slate-800 disabled:opacity-50"
      >
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
