import { type PublicSnapshot, siteContentValue } from '@/lib/content';

type Item = { icon: string; title: string; description: string };

export default function WhyChooseUs({ snap }: { snap: PublicSnapshot }) {
  const items = siteContentValue<Item[]>(snap, 'why_choose_us', []);
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold">Why Choose Us</h2>
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
              <div className="text-3xl">{it.icon || '✨'}</div>
              <h3 className="mt-3 font-semibold">{it.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{it.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
