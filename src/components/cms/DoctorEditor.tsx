'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

type Doctor = {
  id?: number;
  name: string;
  slug: string;
  photoUrl: string;
  qualifications: string;
  bio: string;
  specialties: string;
  yearsExperience: number;
  consultationDurationMin: number;
  acceptingAppointments: boolean;
  displayOrder: number;
  active: boolean;
};

type Schedule = {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY_DOCTOR: Doctor = {
  name: '',
  slug: '',
  photoUrl: '',
  qualifications: '',
  bio: '',
  specialties: '',
  yearsExperience: 0,
  consultationDurationMin: 15,
  acceptingAppointments: true,
  displayOrder: 0,
  active: true,
};

export default function DoctorEditor({
  doctor,
  schedules,
}: {
  doctor: Doctor | null;
  schedules: Schedule[];
}) {
  const router = useRouter();
  const [d, setD] = useState<Doctor>(doctor ?? EMPTY_DOCTOR);
  const [sch, setSch] = useState<Schedule[]>(schedules);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Doctor>(k: K, v: Doctor[K]) {
    setD((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const isNew = !d.id;
      const url = isNew ? '/api/cms/doctors' : `/api/cms/doctors/${d.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...d, schedules: sch }),
      });
      const j = (await res.json()) as { ok?: boolean; id?: number; error?: string };
      if (!res.ok || !j.ok) {
        setError(j.error || 'Save failed.');
      } else {
        if (isNew && j.id) router.push(`/cms/doctors/${j.id}`);
        else router.refresh();
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  function addSchedule() {
    setSch((s) => [...s, { dayOfWeek: 1, startTime: '10:00', endTime: '13:00', active: true }]);
  }
  function updateSch(i: number, patch: Partial<Schedule>) {
    setSch((s) => s.map((x, j) => (i === j ? { ...x, ...patch } : x)));
  }
  function removeSch(i: number) {
    setSch((s) => s.filter((_, j) => j !== i));
  }

  return (
    <div>
      <Link href="/cms/doctors" className="text-sm text-slate-500 hover:text-slate-700">
        ← Doctors
      </Link>
      <h1 className="text-xl font-semibold mt-2 mb-4">
        {d.id ? 'Edit Doctor' : 'New Doctor'}
      </h1>
      <div className="space-y-6 max-w-3xl">
        <Section title="Profile">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name">
              <input
                className="input"
                value={d.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </Field>
            <Field label="Slug">
              <input
                className="input"
                value={d.slug}
                onChange={(e) => update('slug', e.target.value)}
              />
            </Field>
            <Field label="Photo URL">
              <input
                className="input"
                value={d.photoUrl}
                onChange={(e) => update('photoUrl', e.target.value)}
              />
            </Field>
            <Field label="Specialties (comma-separated)">
              <input
                className="input"
                value={d.specialties}
                onChange={(e) => update('specialties', e.target.value)}
              />
            </Field>
            <Field label="Qualifications">
              <input
                className="input"
                value={d.qualifications}
                onChange={(e) => update('qualifications', e.target.value)}
              />
            </Field>
            <Field label="Years of experience">
              <input
                type="number"
                className="input"
                value={d.yearsExperience}
                onChange={(e) => update('yearsExperience', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Consultation duration (min)">
              <input
                type="number"
                className="input"
                value={d.consultationDurationMin}
                onChange={(e) => update('consultationDurationMin', Number(e.target.value) || 15)}
              />
            </Field>
            <Field label="Display order">
              <input
                type="number"
                className="input"
                value={d.displayOrder}
                onChange={(e) => update('displayOrder', Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Field label="Bio">
            <textarea
              rows={4}
              className="input"
              value={d.bio}
              onChange={(e) => update('bio', e.target.value)}
            />
          </Field>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={d.acceptingAppointments}
                onChange={(e) => update('acceptingAppointments', e.target.checked)}
              />
              Accepting online appointments
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={d.active}
                onChange={(e) => update('active', e.target.checked)}
              />
              Active
            </label>
          </div>
        </Section>

        <Section title="Weekly schedule">
          <p className="text-xs text-slate-500 mb-2">
            Recurring availability. Use the Calendar page to set per-date blocks.
          </p>
          <ul className="space-y-2">
            {sch.length === 0 ? (
              <li className="text-sm text-slate-500">No schedule windows yet.</li>
            ) : (
              sch.map((s, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    value={s.dayOfWeek}
                    onChange={(e) => updateSch(i, { dayOfWeek: Number(e.target.value) })}
                    className="input w-auto"
                  >
                    {DAY_LABELS.map((lbl, idx) => (
                      <option key={idx} value={idx}>{lbl}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={s.startTime}
                    onChange={(e) => updateSch(i, { startTime: e.target.value })}
                    className="input w-auto"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={s.endTime}
                    onChange={(e) => updateSch(i, { endTime: e.target.value })}
                    className="input w-auto"
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={s.active}
                      onChange={(e) => updateSch(i, { active: e.target.checked })}
                    />
                    active
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSch(i)}
                    className="text-xs text-red-600 hover:underline ml-auto"
                  >
                    remove
                  </button>
                </li>
              ))
            )}
          </ul>
          <button
            type="button"
            onClick={addSchedule}
            className="mt-3 px-3 py-1.5 text-sm rounded-lg border border-slate-200"
          >
            + Add window
          </button>
        </Section>

        <div className="flex gap-3">
          <button
            disabled={busy || !d.name || !d.slug}
            onClick={save}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
          {error ? <p className="text-sm text-red-600 self-center">{error}</p> : null}
        </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
