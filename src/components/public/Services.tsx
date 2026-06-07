import type { PublicSnapshot } from '@/lib/content';

export default function Services({ snap }: { snap: PublicSnapshot }) {
  if (snap.services.length === 0) return null;

  return (
    <section id="services" className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Our Services</h2>
          <p className="mt-2 text-slate-500">Comprehensive care, all under one roof.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {snap.services.map((s) => (
            <div
              key={s.id}
              className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-2xl transition group-hover:bg-[var(--color-primary)]/15">
                {s.icon || '🩺'}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{s.name}</h3>
              {s.description ? (
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{s.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
