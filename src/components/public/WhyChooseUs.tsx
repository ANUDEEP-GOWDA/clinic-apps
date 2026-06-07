import { type PublicSnapshot, siteContentValue } from '@/lib/content';

type Item = { icon: string; title: string; description: string };

export default function WhyChooseUs({ snap }: { snap: PublicSnapshot }) {
  const items = siteContentValue<Item[]>(snap, 'why_choose_us', []);
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--color-primary)]">
            Why Us
          </div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why Choose Us</h2>
          <p className="mt-2 text-slate-500">We go further to make you feel better.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((it, i) => (
            <div
              key={i}
              className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-3xl transition group-hover:bg-[var(--color-primary)]/25">
                {it.icon || '✨'}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{it.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
