import type { PublicSnapshot } from '@/lib/content';

export default function Services({ snap }: { snap: PublicSnapshot }) {
  if (snap.services.length === 0) return null;
  return (
    <section id="services" className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold">Our Services</h2>
        <p className="mt-2 text-slate-600">Comprehensive care, all in one place.</p>
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {snap.services.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-100 p-5 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="text-3xl">{s.icon || '🩺'}</div>
              <h3 className="mt-3 font-semibold">{s.name}</h3>
              {s.description ? (
                <p className="mt-1 text-sm text-slate-600">{s.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
