'use client';

import { useRef, useState } from 'react';
import type { ThemeConfig } from '@/lib/theme';

// ─── Preset palettes ─────────────────────────────────────────────────────────

const PALETTES: Array<{ name: string; colors: ThemeConfig }> = [
  { name: 'Medical Blue', colors: { primary: '#2563eb', secondary: '#10b981', accent: '#f59e0b', background: '#ffffff', foreground: '#0f172a', fontFamily: 'Inter' } },
  { name: 'Forest Green', colors: { primary: '#059669', secondary: '#3b82f6', accent: '#f97316', background: '#ffffff', foreground: '#0f172a', fontFamily: 'Inter' } },
  { name: 'Ocean Teal', colors: { primary: '#0d9488', secondary: '#6366f1', accent: '#f59e0b', background: '#ffffff', foreground: '#0f172a', fontFamily: 'Inter' } },
  { name: 'Rose Care', colors: { primary: '#e11d48', secondary: '#8b5cf6', accent: '#f97316', background: '#ffffff', foreground: '#0f172a', fontFamily: 'Inter' } },
  { name: 'Purple Wellness', colors: { primary: '#7c3aed', secondary: '#0ea5e9', accent: '#10b981', background: '#ffffff', foreground: '#0f172a', fontFamily: 'Inter' } },
  { name: 'Warm Amber', colors: { primary: '#d97706', secondary: '#059669', accent: '#3b82f6', background: '#fffbeb', foreground: '#1c1917', fontFamily: 'Inter' } },
  { name: 'Navy Prestige', colors: { primary: '#1e3a5f', secondary: '#0ea5e9', accent: '#f59e0b', background: '#ffffff', foreground: '#0f172a', fontFamily: 'Inter' } },
  { name: 'Coral Modern', colors: { primary: '#f43f5e', secondary: '#06b6d4', accent: '#84cc16', background: '#ffffff', foreground: '#0f172a', fontFamily: 'Inter' } },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FAQ = { question: string; answer: string };
type WhyItem = { icon: string; title: string; description: string };

type InitialData = {
  clinicSlug: string;
  settings: {
    heroHeadline: string;
    heroSubheadline: string;
    heroImageUrl: string;
    about: string;
    logoUrl: string;
    faviconUrl: string;
  };
  theme: ThemeConfig;
  heroBadges: string[];
  aboutImageUrl: string;
  aboutBullets: string[];
  whyChooseUs: WhyItem[];
  faq: FAQ[];
  googleRating: { rating: number; count: number };
  footerTagline: string;
  serviceAreas: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

// ─── Helper: iframe refresh ───────────────────────────────────────────────────

function useIframeRef() {
  const ref = useRef<HTMLIFrameElement>(null);
  function refresh() {
    const iframe = ref.current;
    if (!iframe) return;
    const src = iframe.src;
    iframe.src = '';
    iframe.src = src;
  }
  return { ref, refresh };
}

// ─── Helper: API calls ────────────────────────────────────────────────────────

async function patchSettings(body: Record<string, unknown>): Promise<boolean> {
  const res = await fetch('/api/cms/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function putContent(key: string, value: unknown): Promise<boolean> {
  const res = await fetch(`/api/cms/site-content/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
  return res.ok;
}

// ─── Accordion wrapper ────────────────────────────────────────────────────────

function Section({
  id, open, onToggle, title, subtitle, children,
}: {
  id: string; open: boolean; onToggle: (id: string) => void;
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-100 rounded-2xl bg-white overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
      >
        <div>
          <div className="font-medium text-slate-900">{title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ─── Save bar ────────────────────────────────────────────────────────────────

function SaveBar({ busy, status, onSave }: { busy: boolean; status: string | null; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        disabled={busy}
        onClick={onSave}
        className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save'}
      </button>
      {status ? (
        <span className={`text-sm ${status.includes('fail') || status.includes('error') ? 'text-red-600' : 'text-emerald-700'}`}>
          {status}
        </span>
      ) : null}
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30';

// ─── Main component ───────────────────────────────────────────────────────────

export default function WebsiteBuilder({ initial }: { initial: InitialData }) {
  const { ref: iframeRef, refresh: refreshPreview } = useIframeRef();
  const [openSection, setOpenSection] = useState<string>('theme');
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  function toggleSection(id: string) {
    setOpenSection((cur) => (cur === id ? '' : id));
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Mobile tab switcher */}
      <div className="mb-4 flex rounded-xl border border-slate-200 bg-slate-50 p-1 md:hidden">
        <button
          onClick={() => setPreviewTab('edit')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${previewTab === 'edit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
        >
          Edit
        </button>
        <button
          onClick={() => setPreviewTab('preview')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${previewTab === 'preview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
        >
          Preview
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left panel: editor ── */}
        <div className={`flex-1 min-w-0 space-y-3 ${previewTab === 'preview' ? 'hidden md:block' : ''}`}>

          {/* Theme section */}
          <Section id="theme" open={openSection === 'theme'} onToggle={toggleSection}
            title="Theme & Colors" subtitle="Brand colors and font for the whole site">
            <ThemeSection initial={initial.theme} onSaved={refreshPreview} />
          </Section>

          {/* Hero section */}
          <Section id="hero" open={openSection === 'hero'} onToggle={toggleSection}
            title="Hero Section" subtitle="Headline, subheadline, hero image, trust badges">
            <HeroSection
              initialSettings={initial.settings}
              initialBadges={initial.heroBadges}
              onSaved={refreshPreview}
            />
          </Section>

          {/* About section */}
          <Section id="about" open={openSection === 'about'} onToggle={toggleSection}
            title="About Section" subtitle="Clinic description, image, and highlight bullets">
            <AboutSection
              initialAbout={initial.settings.about}
              initialImageUrl={initial.aboutImageUrl}
              initialBullets={initial.aboutBullets}
              onSaved={refreshPreview}
            />
          </Section>

          {/* Why Choose Us */}
          <Section id="why" open={openSection === 'why'} onToggle={toggleSection}
            title="Why Choose Us" subtitle="Up to 4 feature highlights">
            <WhyChooseUsSection initial={initial.whyChooseUs} onSaved={refreshPreview} />
          </Section>

          {/* FAQ */}
          <Section id="faq" open={openSection === 'faq'} onToggle={toggleSection}
            title="FAQ" subtitle="Frequently asked questions">
            <FaqSection initial={initial.faq} onSaved={refreshPreview} />
          </Section>

          {/* Extras */}
          <Section id="extras" open={openSection === 'extras'} onToggle={toggleSection}
            title="Extras" subtitle="Rating summary, footer tagline, service areas">
            <ExtrasSection
              initialRating={initial.googleRating}
              initialTagline={initial.footerTagline}
              initialAreas={initial.serviceAreas}
              onSaved={refreshPreview}
            />
          </Section>

          {/* SEO */}
          <Section id="seo" open={openSection === 'seo'} onToggle={toggleSection}
            title="SEO" subtitle="Page title, meta description, keywords">
            <SeoSection
              initialTitle={initial.seoTitle}
              initialDescription={initial.seoDescription}
              initialKeywords={initial.seoKeywords}
              onSaved={refreshPreview}
            />
          </Section>
        </div>

        {/* ── Right panel: iframe preview ── */}
        <div className={`hidden md:flex w-[420px] xl:w-[520px] flex-shrink-0 flex-col ${previewTab === 'preview' ? '!flex w-full' : ''}`}>
          <div className="sticky top-[88px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Live Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshPreview}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  ↺ Refresh
                </button>
                <a
                  href={`/c/${initial.clinicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  Open ↗
                </a>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white" style={{ height: 'calc(100vh - 140px)' }}>
              <iframe
                ref={iframeRef}
                src={`/c/${initial.clinicSlug}`}
                className="w-full h-full"
                title="Public site preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Theme ───────────────────────────────────────────────────────────

function ThemeSection({ initial, onSaved }: { initial: ThemeConfig; onSaved: () => void }) {
  const [t, setT] = useState<ThemeConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function applyPalette(p: ThemeConfig) {
    setT(p);
    setStatus(null);
  }

  async function save() {
    setBusy(true); setStatus(null);
    const ok = await patchSettings({ themeConfig: JSON.stringify(t) });
    setStatus(ok ? '✓ Saved' : 'Save failed');
    if (ok) onSaved();
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      {/* Preset palettes */}
      <div>
        <div className="text-xs text-slate-500 mb-2">Preset palettes — click to apply</div>
        <div className="grid grid-cols-4 gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPalette(p.colors)}
              title={p.name}
              className={`group relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${
                t.primary === p.colors.primary ? 'border-slate-900' : 'border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex gap-0.5">
                <div className="h-5 w-5 rounded-l-full" style={{ background: p.colors.primary }} />
                <div className="h-5 w-5 rounded-r-full" style={{ background: p.colors.secondary }} />
              </div>
              <div className="text-[10px] text-slate-500 leading-tight text-center">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div>
        <div className="text-xs text-slate-500 mb-2">Custom colors</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ColorPicker label="Primary" value={t.primary} onChange={(v) => setT({ ...t, primary: v })} />
          <ColorPicker label="Secondary" value={t.secondary} onChange={(v) => setT({ ...t, secondary: v })} />
          <ColorPicker label="Accent" value={t.accent} onChange={(v) => setT({ ...t, accent: v })} />
          <ColorPicker label="Background" value={t.background} onChange={(v) => setT({ ...t, background: v })} />
          <ColorPicker label="Text color" value={t.foreground} onChange={(v) => setT({ ...t, foreground: v })} />
          <Field label="Font family">
            <input className={inputCls} value={t.fontFamily} onChange={(e) => setT({ ...t, fontFamily: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Mini preview */}
      <div className="rounded-xl border border-slate-100 p-3" style={{ background: t.background, color: t.foreground }}>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-lg text-xs text-white" style={{ background: t.primary }}>Primary</span>
          <span className="px-3 py-1 rounded-lg text-xs text-white" style={{ background: t.secondary }}>Secondary</span>
          <span className="px-3 py-1 rounded-lg text-xs" style={{ color: t.accent }}>Accent</span>
        </div>
      </div>

      <SaveBar busy={busy} status={status} onSave={save} />
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 p-0.5"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 rounded-xl border border-slate-200 px-2 py-2 text-xs font-mono bg-white focus:outline-none"
        />
      </div>
    </Field>
  );
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection({
  initialSettings, initialBadges, onSaved,
}: {
  initialSettings: InitialData['settings'];
  initialBadges: string[];
  onSaved: () => void;
}) {
  const [headline, setHeadline] = useState(initialSettings.heroHeadline);
  const [sub, setSub] = useState(initialSettings.heroSubheadline);
  const [img, setImg] = useState(initialSettings.heroImageUrl);
  const [badges, setBadges] = useState<string[]>(initialBadges);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setBusy(true); setStatus(null);
    const [ok1, ok2] = await Promise.all([
      patchSettings({ heroHeadline: headline, heroSubheadline: sub, heroImageUrl: img }),
      putContent('hero_badges', badges.filter((b) => b.trim())),
    ]);
    setStatus(ok1 && ok2 ? '✓ Saved' : 'Save failed');
    if (ok1 && ok2) onSaved();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <Field label="Headline">
        <input className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Advanced Healthcare You Can Trust" />
      </Field>
      <Field label="Subheadline">
        <input className={inputCls} value={sub} onChange={(e) => setSub(e.target.value)} placeholder="Compassionate care for your whole family." />
      </Field>
      <Field label="Hero image URL">
        <input className={inputCls} value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://… or /uploads/…" />
      </Field>
      <Field label="Trust badges (shown below CTAs)">
        <div className="space-y-2">
          {badges.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                value={b}
                onChange={(e) => setBadges((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                placeholder="e.g. NABH Accredited"
              />
              <button onClick={() => setBadges((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-red-500 shrink-0">✕</button>
            </div>
          ))}
          <button onClick={() => setBadges((p) => [...p, ''])} className="text-xs text-[var(--color-primary)] hover:underline">+ Add badge</button>
        </div>
      </Field>
      <SaveBar busy={busy} status={status} onSave={save} />
    </div>
  );
}

// ─── Section: About ───────────────────────────────────────────────────────────

function AboutSection({
  initialAbout, initialImageUrl, initialBullets, onSaved,
}: {
  initialAbout: string; initialImageUrl: string; initialBullets: string[]; onSaved: () => void;
}) {
  const [about, setAbout] = useState(initialAbout);
  const [imgUrl, setImgUrl] = useState(initialImageUrl);
  const [bullets, setBullets] = useState<string[]>(initialBullets);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setBusy(true); setStatus(null);
    const [ok1, ok2, ok3] = await Promise.all([
      patchSettings({ about }),
      putContent('about_image_url', imgUrl),
      putContent('about_bullets', bullets.filter((b) => b.trim())),
    ]);
    setStatus(ok1 && ok2 && ok3 ? '✓ Saved' : 'Save failed');
    if (ok1 && ok2 && ok3) onSaved();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <Field label="About text">
        <textarea className={inputCls} rows={5} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell patients about your clinic…" />
      </Field>
      <Field label="About section image URL">
        <input className={inputCls} value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="https://… or /uploads/…" />
      </Field>
      <Field label="Highlight bullets (✓ checkmarks)">
        <div className="space-y-2">
          {bullets.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                value={b}
                onChange={(e) => setBullets((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                placeholder="e.g. 10+ years of experience"
              />
              <button onClick={() => setBullets((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-red-500 shrink-0">✕</button>
            </div>
          ))}
          <button onClick={() => setBullets((p) => [...p, ''])} className="text-xs text-[var(--color-primary)] hover:underline">+ Add bullet</button>
        </div>
      </Field>
      <SaveBar busy={busy} status={status} onSave={save} />
    </div>
  );
}

// ─── Section: Why Choose Us ───────────────────────────────────────────────────

function WhyChooseUsSection({ initial, onSaved }: { initial: WhyItem[]; onSaved: () => void }) {
  const [items, setItems] = useState<WhyItem[]>(initial.length ? initial : []);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function update(i: number, patch: Partial<WhyItem>) {
    setItems((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  async function save() {
    setBusy(true); setStatus(null);
    const ok = await putContent('why_choose_us', items.filter((x) => x.title.trim()));
    setStatus(ok ? '✓ Saved' : 'Save failed');
    if (ok) onSaved();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Aim for 4 items for the cleanest layout.</p>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-start rounded-xl border border-slate-100 p-3">
            <input
              className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white text-center"
              placeholder="🏥"
              value={it.icon}
              onChange={(e) => update(i, { icon: e.target.value })}
            />
            <input
              className={`${inputCls} flex-1`}
              placeholder="Title"
              value={it.title}
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <input
              className={`${inputCls} flex-1`}
              placeholder="Short description"
              value={it.description}
              onChange={(e) => update(i, { description: e.target.value })}
            />
            <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-xs text-red-500 pt-2 shrink-0">✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => setItems((p) => [...p, { icon: '', title: '', description: '' }])} className="text-xs text-[var(--color-primary)] hover:underline">
        + Add item
      </button>
      <SaveBar busy={busy} status={status} onSave={save} />
    </div>
  );
}

// ─── Section: FAQ ─────────────────────────────────────────────────────────────

function FaqSection({ initial, onSaved }: { initial: FAQ[]; onSaved: () => void }) {
  const [items, setItems] = useState<FAQ[]>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function update(i: number, patch: Partial<FAQ>) {
    setItems((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  async function save() {
    setBusy(true); setStatus(null);
    const ok = await putContent('faq', items.filter((x) => x.question.trim()));
    setStatus(ok ? '✓ Saved' : 'Save failed');
    if (ok) onSaved();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-slate-100 p-3 space-y-2">
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Question"
                value={it.question}
                onChange={(e) => update(i, { question: e.target.value })}
              />
              <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-xs text-red-500 shrink-0">✕</button>
            </div>
            <textarea
              className={inputCls}
              rows={2}
              placeholder="Answer"
              value={it.answer}
              onChange={(e) => update(i, { answer: e.target.value })}
            />
          </div>
        ))}
      </div>
      <button onClick={() => setItems((p) => [...p, { question: '', answer: '' }])} className="text-xs text-[var(--color-primary)] hover:underline">
        + Add FAQ
      </button>
      <SaveBar busy={busy} status={status} onSave={save} />
    </div>
  );
}

// ─── Section: Extras ──────────────────────────────────────────────────────────

function ExtrasSection({
  initialRating, initialTagline, initialAreas, onSaved,
}: {
  initialRating: { rating: number; count: number };
  initialTagline: string;
  initialAreas: string[];
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(initialRating.rating);
  const [count, setCount] = useState(initialRating.count);
  const [tagline, setTagline] = useState(initialTagline);
  const [areas, setAreas] = useState<string[]>(initialAreas);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setBusy(true); setStatus(null);
    const [ok1, ok2, ok3] = await Promise.all([
      putContent('google_rating_summary', { rating: Number(rating) || 0, count: Number(count) || 0 }),
      putContent('footer_tagline', tagline),
      putContent('service_areas', areas.filter((a) => a.trim())),
    ]);
    setStatus(ok1 && ok2 && ok3 ? '✓ Saved' : 'Save failed');
    if (ok1 && ok2 && ok3) onSaved();
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-medium text-slate-600 mb-2">Google Rating (shown in hero & reviews)</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rating (e.g. 4.9)">
            <input className={inputCls} type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
          </Field>
          <Field label="Review count">
            <input className={inputCls} type="number" min="0" value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </Field>
        </div>
      </div>
      <Field label="Footer tagline">
        <input className={inputCls} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Caring for your family, every day." />
      </Field>
      <Field label="Service areas (for SEO)">
        <div className="space-y-2">
          {areas.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} value={a} onChange={(e) => setAreas((p) => p.map((x, j) => j === i ? e.target.value : x))} placeholder="e.g. Banjara Hills" />
              <button onClick={() => setAreas((p) => p.filter((_, j) => j !== i))} className="text-xs text-red-500 shrink-0">✕</button>
            </div>
          ))}
          <button onClick={() => setAreas((p) => [...p, ''])} className="text-xs text-[var(--color-primary)] hover:underline">+ Add area</button>
        </div>
      </Field>
      <SaveBar busy={busy} status={status} onSave={save} />
    </div>
  );
}

// ─── Section: SEO ─────────────────────────────────────────────────────────────

function SeoSection({
  initialTitle, initialDescription, initialKeywords, onSaved,
}: {
  initialTitle: string; initialDescription: string; initialKeywords: string; onSaved: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [desc, setDesc] = useState(initialDescription);
  const [kw, setKw] = useState(initialKeywords);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setBusy(true); setStatus(null);
    const [ok1, ok2, ok3] = await Promise.all([
      putContent('seo_default_title', title),
      putContent('seo_default_description', desc),
      putContent('seo_keywords', kw),
    ]);
    setStatus(ok1 && ok2 && ok3 ? '✓ Saved' : 'Save failed');
    if (ok1 && ok2 && ok3) onSaved();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <Field label="Page title (under 60 chars)">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="mt-1 text-xs text-slate-400">{title.length}/60 chars</div>
      </Field>
      <Field label="Meta description (under 160 chars)">
        <textarea className={inputCls} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="mt-1 text-xs text-slate-400">{desc.length}/160 chars</div>
      </Field>
      <Field label="Keywords (comma-separated)">
        <input className={inputCls} value={kw} onChange={(e) => setKw(e.target.value)} />
      </Field>
      <SaveBar busy={busy} status={status} onSave={save} />
    </div>
  );
}
