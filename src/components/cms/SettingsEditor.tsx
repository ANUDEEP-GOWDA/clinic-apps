'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DAY_KEYS, type DayKey, parseWorkingHours, stringifyWorkingHours,
  type Window, EMPTY_WORKING_HOURS,
} from '@/lib/working-hours';

type Initial = {
  clinicName: string;
  tagline: string;
  about: string;
  address: string;
  phone: string;
  email: string;
  googlePlaceId: string;
  googleMapsUrl: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  workingHours: string;
  logoUrl: string;
  faviconUrl: string;
  heroImageUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  customDomain: string | null;
  clinicSlug: string;
};

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

export default function SettingsEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [s, setS] = useState<Initial>(initial);
  const [wh, setWh] = useState(parseWorkingHours(initial.workingHours));
  const [domain, setDomain] = useState(initial.customDomain ?? '');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<
    null | { state: 'checking' | 'ok' | 'misconfigured' | 'unset'; detail?: string }
  >(null);

  function set<K extends keyof Initial>(k: K, v: Initial[K]) {
    setS((p) => ({ ...p, [k]: v }));
  }

  function addWindow(d: DayKey) {
    setWh((prev) => ({ ...prev, [d]: [...prev[d], { start: '10:00', end: '13:00' }] }));
  }
  function updateWindow(d: DayKey, i: number, w: Window) {
    setWh((prev) => ({ ...prev, [d]: prev[d].map((x, j) => (i === j ? w : x)) }));
  }
  function removeWindow(d: DayKey, i: number) {
    setWh((prev) => ({ ...prev, [d]: prev[d].filter((_, j) => j !== i) }));
  }

  async function checkDomain() {
    const d = domain.trim().toLowerCase();
    if (!d) { setDomainStatus({ state: 'unset' }); return; }
    setDomainStatus({ state: 'checking' });
    try {
      const r = await fetch(`/api/cms/settings/check-domain?d=${encodeURIComponent(d)}`);
      const j = (await r.json()) as { ok?: boolean; detail?: string };
      setDomainStatus({
        state: j.ok ? 'ok' : 'misconfigured',
        detail: j.detail,
      });
    } catch {
      setDomainStatus({ state: 'misconfigured', detail: 'Could not check. Try again.' });
    }
  }

  async function save() {
    setBusy(true); setStatus(null);
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...s,
          workingHours: stringifyWorkingHours(wh),
          customDomain: domain.trim().toLowerCase() || null,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && j.ok !== false) {
        setStatus('Saved.');
        router.refresh();
      } else {
        setStatus(j.error === 'domain_taken' ? 'That domain is already used by another clinic.' :
                  j.error === 'invalid_domain' ? 'Domain looks invalid. Use format: example.com' :
                  'Save failed.');
      }
    } catch {
      setStatus('Network error.');
    } finally {
      setBusy(false);
    }
  }

  const slugUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/c/${initial.clinicSlug}`
    : `/c/${initial.clinicSlug}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Public Website">
        <div className="space-y-3">
          <div className="text-sm text-slate-700">
            Your public website is always available at:
            <div className="mt-1">
              <a href={slugUrl} target="_blank" rel="noopener noreferrer"
                className="text-emerald-700 underline break-all">{slugUrl}</a>
            </div>
          </div>

          <hr className="border-slate-100" />

          <Field label="Custom domain (optional)">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="e.g. myclinic.com"
                value={domain}
                onChange={(e) => { setDomain(e.target.value); setDomainStatus(null); }}
              />
              <button type="button" onClick={checkDomain}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50">
                Check DNS
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Point a CNAME at <code className="bg-slate-100 px-1 rounded">cname.railway.app</code> from
              your DNS provider. Also add the domain in Railway → Settings → Networking → Custom Domain.
            </p>
          </Field>

          {domainStatus && (
            <div className={`text-sm rounded-lg p-3 ${
              domainStatus.state === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              domainStatus.state === 'checking' ? 'bg-slate-50 text-slate-600' :
              domainStatus.state === 'unset' ? 'bg-slate-50 text-slate-600' :
              'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {domainStatus.state === 'checking' && 'Checking DNS…'}
              {domainStatus.state === 'ok' && `✓ DNS looks correct${domainStatus.detail ? ` (${domainStatus.detail})` : ''}. After saving, visiting your domain will show this clinic's public site.`}
              {domainStatus.state === 'misconfigured' && `⚠ ${domainStatus.detail || 'DNS is not pointing at this app yet. Update your CNAME and try again in a few minutes.'}`}
              {domainStatus.state === 'unset' && 'No domain entered.'}
            </div>
          )}
        </div>
      </Section>

      <Section title="Clinic">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Clinic name"><input className="input" value={s.clinicName} onChange={(e) => set('clinicName', e.target.value)} /></Field>
          <Field label="Tagline"><input className="input" value={s.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
          <Field label="Phone"><input className="input" value={s.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={s.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Address" full>
            <input className="input" value={s.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Timezone"><input className="input" value={s.timezone} onChange={(e) => set('timezone', e.target.value)} /></Field>
          <Field label="Google Place ID"><input className="input" value={s.googlePlaceId} onChange={(e) => set('googlePlaceId', e.target.value)} /></Field>
          <Field label="Google Maps URL" full>
            <input className="input" value={s.googleMapsUrl} onChange={(e) => set('googleMapsUrl', e.target.value)} />
          </Field>
          <Field label="Latitude"><input className="input" type="number" step="any" value={s.latitude ?? ''} onChange={(e) => set('latitude', e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Longitude"><input className="input" type="number" step="any" value={s.longitude ?? ''} onChange={(e) => set('longitude', e.target.value ? Number(e.target.value) : null)} /></Field>
        </div>
        <Field label="About">
          <textarea className="input" rows={4} value={s.about} onChange={(e) => set('about', e.target.value)} />
        </Field>
      </Section>

      <Section title="Branding & Hero">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Logo URL"><input className="input" value={s.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} /></Field>
          <Field label="Favicon URL"><input className="input" value={s.faviconUrl} onChange={(e) => set('faviconUrl', e.target.value)} /></Field>
          <Field label="Hero image URL" full><input className="input" value={s.heroImageUrl} onChange={(e) => set('heroImageUrl', e.target.value)} /></Field>
          <Field label="Hero headline" full><input className="input" value={s.heroHeadline} onChange={(e) => set('heroHeadline', e.target.value)} /></Field>
          <Field label="Hero subheadline" full><input className="input" value={s.heroSubheadline} onChange={(e) => set('heroSubheadline', e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Working hours">
        <p className="text-xs text-slate-500 mb-2">Used for the public site and SEO. Doctor-specific schedules live on each doctor.</p>
        <div className="space-y-3">
          {DAY_KEYS.map((d) => (
            <div key={d} className="flex flex-wrap items-center gap-2">
              <div className="w-12 text-sm font-medium">{DAY_LABELS[d]}</div>
              {wh[d].length === 0 ? (
                <span className="text-sm text-slate-400">Closed</span>
              ) : (
                wh[d].map((w, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input type="time" value={w.start}
                      onChange={(e) => updateWindow(d, i, { ...w, start: e.target.value })}
                      className="input w-auto" />
                    <span>–</span>
                    <input type="time" value={w.end}
                      onChange={(e) => updateWindow(d, i, { ...w, end: e.target.value })}
                      className="input w-auto" />
                    <button type="button" onClick={() => removeWindow(d, i)}
                      className="text-xs text-red-600 hover:underline ml-1">remove</button>
                  </div>
                ))
              )}
              <button type="button" onClick={() => addWindow(d)}
                className="text-xs text-[var(--color-primary)] hover:underline">+ add window</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setWh(EMPTY_WORKING_HOURS)}
          className="mt-3 text-xs text-slate-500 hover:underline">Clear all</button>
      </Section>

      <div className="flex items-center gap-3">
        <button disabled={busy} onClick={save}
          className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm disabled:opacity-50">
          {busy ? 'Saving…' : 'Save'}
        </button>
        {status ? <span className="text-sm text-slate-600">{status}</span> : null}
      </div>

      <style>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;background:white}`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-5">
      <h2 className="font-medium mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
