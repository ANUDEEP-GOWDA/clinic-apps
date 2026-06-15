'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TemplateSelector from './TemplateSelector';

type Props = {
  settings: {
    clinicName: string;
    tagline: string;
    about: string;
    phone: string;
    email: string;
    address: string;
    googleMapsUrl: string;
    latitude: number | null;
    longitude: number | null;
  };
  packages: Array<{ name: string; label: string; price: string; img: string }>;
  highlights: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
  seo: { title: string; description: string };
  gallery: string[];
  currentTemplate: string;
  serviceSummary: Array<{ name: string }>;
  doctorSummary: Array<{ name: string }>;
  reviewCount: number;
};

export default function WebsiteEditor({
  settings: init,
  packages: initPkgs,
  highlights: initHighlights,
  faqs: initFaqs,
  seo: initSeo,
  gallery: initGallery,
  currentTemplate,
  serviceSummary,
  doctorSummary,
  reviewCount,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // ── Settings fields ──
  const [s, setS] = useState(init);
  function set<K extends keyof typeof init>(k: K, v: (typeof init)[K]) {
    setS((p) => ({ ...p, [k]: v }));
  }

  // ── Treatment Plans ──
  const [packages, setPackages] = useState(initPkgs);
  function updatePkg(i: number, field: string, val: string) {
    setPackages((p) => p.map((pkg, j) => (j === i ? { ...pkg, [field]: val } : pkg)));
  }
  function addPkg() {
    setPackages((p) => [...p, { name: '', label: '', price: '', img: '' }]);
  }
  function removePkg(i: number) {
    setPackages((p) => p.filter((_, j) => j !== i));
  }

  // ── Highlights (Why Choose Us) ──
  const [highlights, setHighlights] = useState(initHighlights);
  function updateHL(i: number, field: string, val: string) {
    setHighlights((p) => p.map((h, j) => (j === i ? { ...h, [field]: val } : h)));
  }
  function addHL() {
    setHighlights((p) => [...p, { title: '', description: '' }]);
  }
  function removeHL(i: number) {
    setHighlights((p) => p.filter((_, j) => j !== i));
  }

  // ── FAQs ──
  const [faqs, setFaqs] = useState(initFaqs);
  function updateFaq(i: number, field: string, val: string) {
    setFaqs((p) => p.map((f, j) => (j === i ? { ...f, [field]: val } : f)));
  }
  function addFaq() {
    setFaqs((p) => [...p, { question: '', answer: '' }]);
  }
  function removeFaq(i: number) {
    setFaqs((p) => p.filter((_, j) => j !== i));
  }

  // ── SEO ──
  const [seo, setSeo] = useState(initSeo);

  // ── Gallery ──
  const [gallery, setGallery] = useState<string[]>(initGallery);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadPhotos(files: FileList) {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('/api/cms/media/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (data.ok && data.media?.url) newUrls.push(data.media.url);
      } catch {}
    }
    setGallery((prev) => [...prev, ...newUrls]);
    setUploading(false);
  }

  function removePhoto(i: number) {
    setGallery((prev) => prev.filter((_, j) => j !== i));
  }

  // ── Save All ──
  async function saveAll() {
    setBusy(true);
    setStatus(null);
    try {
      // Save settings
      const settingsRes = await fetch('/api/cms/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: s.clinicName,
          tagline: s.tagline,
          about: s.about,
          phone: s.phone,
          email: s.email,
          address: s.address,
          googleMapsUrl: s.googleMapsUrl,
          latitude: s.latitude,
          longitude: s.longitude,
        }),
      });

      // Save site content (packages, highlights, faqs, seo)
      const contentSaves = [
        fetch('/api/cms/site-content/packages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: packages }),
        }),
        fetch('/api/cms/site-content/why_choose_us', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: highlights }),
        }),
        fetch('/api/cms/site-content/faq', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: faqs }),
        }),
        fetch('/api/cms/site-content/seo_default_title', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: seo.title }),
        }),
        fetch('/api/cms/site-content/gallery_images', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: gallery }),
        }),
        fetch('/api/cms/site-content/seo_default_description', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: seo.description }),
        }),
      ];

      const results = await Promise.all([settingsRes, ...contentSaves]);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        setStatus('All changes saved.');
        router.refresh();
      } else {
        setStatus('Some changes failed to save. Try again.');
      }
    } catch {
      setStatus('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Edit Your Website</h1>
        <p className="text-sm text-slate-500">Fill in your clinic details. We handle the layout.</p>
      </div>

      {/* ── YOUR CLINIC ────────────────────────── */}
      <Section title="Your Clinic">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Clinic Name">
            <input className="input" value={s.clinicName} onChange={(e) => set('clinicName', e.target.value)} />
          </Field>
          <Field label="Tagline">
            <input className="input" placeholder="e.g. Expert care, close to home" value={s.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="input" value={s.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="input" value={s.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Address" full>
            <input className="input" value={s.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </div>
        <Field label="About Your Clinic">
          <textarea className="input" rows={4} placeholder="Tell patients about your clinic..." value={s.about} onChange={(e) => set('about', e.target.value)} />
        </Field>
      </Section>

      {/* ── LOCATION & MAP ──────────────────────── */}
      <Section title="Location & Map">
        <Field label="Google Maps Link">
          <input className="input" placeholder="Paste your Google Maps share link" value={s.googleMapsUrl} onChange={(e) => set('googleMapsUrl', e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Latitude">
            <input className="input" type="number" step="any" placeholder="e.g. 13.0827" value={s.latitude ?? ''} onChange={(e) => set('latitude', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Longitude">
            <input className="input" type="number" step="any" placeholder="e.g. 80.2707" value={s.longitude ?? ''} onChange={(e) => set('longitude', e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <p className="text-xs text-slate-400">The map will appear on your website automatically if a Google Maps link is provided.</p>
      </Section>

      {/* ── SERVICES (link to existing page) ──── */}
      <Section title="Services">
        {serviceSummary.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {serviceSummary.map((s, i) => (
              <span key={i} className="bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full">{s.name}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 mb-3">No services added yet.</p>
        )}
        <Link href="/cms/services" className="text-sm text-blue-600 hover:underline font-medium">
          Manage Services →
        </Link>
      </Section>

      {/* ── DOCTORS (link to existing page) ──── */}
      <Section title="Doctors">
        {doctorSummary.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {doctorSummary.map((d, i) => (
              <span key={i} className="bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full">Dr. {d.name}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 mb-3">No doctors added yet.</p>
        )}
        <Link href="/cms/doctors" className="text-sm text-blue-600 hover:underline font-medium">
          Manage Doctors →
        </Link>
      </Section>

      {/* ── TREATMENT PLANS ──────────────────── */}
      <Section title="Treatment Plans">
        <p className="text-xs text-slate-500 mb-3">Add your treatment packages with pricing. These show up as cards on your website.</p>
        <div className="space-y-4">
          {packages.map((pkg, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removePkg(i)} className="absolute top-3 right-3 text-xs text-red-500 hover:underline">Remove</button>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Plan Name">
                  <input className="input" placeholder="e.g. Full Body Checkup" value={pkg.name} onChange={(e) => updatePkg(i, 'name', e.target.value)} />
                </Field>
                <Field label="Price">
                  <input className="input" placeholder="e.g. ₹1,499" value={pkg.price} onChange={(e) => updatePkg(i, 'price', e.target.value)} />
                </Field>
                <Field label="Badge / Label">
                  <input className="input" placeholder="e.g. Most Popular" value={pkg.label} onChange={(e) => updatePkg(i, 'label', e.target.value)} />
                </Field>
                <Field label="Image URL (optional)">
                  <input className="input" placeholder="Leave blank for an auto-generated medical image..." value={pkg.img} onChange={(e) => updatePkg(i, 'img', e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addPkg} className="mt-3 text-sm text-blue-600 hover:underline font-medium">+ Add Treatment Plan</button>
      </Section>

      {/* ── WHY CHOOSE YOUR CLINIC ───────────── */}
      <Section title="Why Choose Your Clinic">
        <p className="text-xs text-slate-500 mb-3">Highlight what makes your clinic special. Aim for 3–4 items.</p>
        <div className="space-y-3">
          {highlights.map((h, i) => (
            <div key={i} className="flex gap-3 items-start bg-slate-50 rounded-xl p-4">
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <Field label="Title">
                  <input className="input" placeholder="e.g. Zero Wait Times" value={h.title} onChange={(e) => updateHL(i, 'title', e.target.value)} />
                </Field>
                <Field label="Description">
                  <input className="input" placeholder="e.g. We run on schedule." value={h.description} onChange={(e) => updateHL(i, 'description', e.target.value)} />
                </Field>
              </div>
              <button onClick={() => removeHL(i)} className="text-xs text-red-500 hover:underline mt-6">Remove</button>
            </div>
          ))}
        </div>
        <button onClick={addHL} className="mt-3 text-sm text-blue-600 hover:underline font-medium">+ Add Highlight</button>
      </Section>

      {/* ── REVIEWS (link to existing page) ── */}
      <Section title="Patient Reviews">
        <p className="text-sm text-slate-500 mb-3">
          {reviewCount > 0 ? `${reviewCount} review${reviewCount > 1 ? 's' : ''} added.` : 'No reviews added yet.'}
        </p>
        <Link href="/cms/reviews" className="text-sm text-blue-600 hover:underline font-medium">
          Manage Reviews →
        </Link>
      </Section>

      {/* ── CLINIC PHOTOS ─────────────────── */}
      <Section title="Clinic Photos">
        <p className="text-xs text-slate-500 mb-3">Upload photos of your clinic, staff, or equipment. These will be displayed on your website.</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {gallery.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 transition flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-xs">Uploading...</span>
            ) : (
              <>
                <span className="text-2xl leading-none">+</span>
                <span className="text-[10px] mt-1">Add Photo</span>
              </>
            )}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
        />
      </Section>

      {/* ── FAQS ─────────────────────────────── */}
      <Section title="Frequently Asked Questions">
        <p className="text-xs text-slate-500 mb-3">Common questions patients might ask. These appear in an accordion on your website.</p>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removeFaq(i)} className="absolute top-3 right-3 text-xs text-red-500 hover:underline">Remove</button>
              <Field label="Question">
                <input className="input" placeholder="e.g. How do I book an appointment?" value={f.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} />
              </Field>
              <Field label="Answer">
                <textarea className="input" rows={2} placeholder="Type your answer..." value={f.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} />
              </Field>
            </div>
          ))}
        </div>
        <button onClick={addFaq} className="mt-3 text-sm text-blue-600 hover:underline font-medium">+ Add Question</button>
      </Section>

      {/* ── GOOGLE SEARCH ────────────────────── */}
      <Section title="Google Search">
        <p className="text-xs text-slate-500 mb-3">Controls how your clinic appears when someone searches on Google.</p>
        <Field label="Page Title (shown as the blue link on Google)">
          <input className="input" placeholder="e.g. MediCore Clinic — Expert Care in Chennai" value={seo.title} onChange={(e) => setSeo((p) => ({ ...p, title: e.target.value }))} />
        </Field>
        <Field label="Description (shown below the title on Google)">
          <textarea className="input" rows={2} placeholder="e.g. Book dental care, physiotherapy, and checkups online..." value={seo.description} onChange={(e) => setSeo((p) => ({ ...p, description: e.target.value }))} />
        </Field>
      </Section>

      {/* ── SAVE BUTTON ──────────────────────── */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 py-4 -mx-6 px-6 flex items-center gap-3 z-10">
        <button
          disabled={busy}
          onClick={saveAll}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-50 hover:bg-slate-800 transition"
        >
          {busy ? 'Saving…' : 'Save All Changes'}
        </button>
        {status && <span className="text-sm text-slate-600">{status}</span>}
      </div>

      {/* ── TEMPLATE PICKER ──────────────────── */}
      <Section title="Choose Your Template">
        <p className="text-xs text-slate-500 mb-3">Pick a design for your website. This change applies instantly.</p>
        <TemplateSelector current={currentTemplate} />
      </Section>

      <style>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;background:white}.input:focus{outline:none;border-color:#94a3b8;box-shadow:0 0 0 3px rgba(148,163,184,0.1)}`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-5">
      <h2 className="font-semibold text-base mb-4">{title}</h2>
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
