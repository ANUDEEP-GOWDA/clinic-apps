import Image from 'next/image';
import type { PublicSnapshot } from '@/lib/content';

export default function Doctors({ snap }: { snap: PublicSnapshot }) {
  if (snap.doctors.length === 0) return null;

  return (
    <section id="doctors" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Meet Our Doctors</h2>
          <p className="mt-2 text-slate-500">Experienced professionals dedicated to your wellbeing.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {snap.doctors.map((d) => (
            <div
              key={d.id}
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10">
                {d.photoUrl ? (
                  <Image
                    src={d.photoUrl}
                    alt={d.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)]/20">
                    <span className="text-3xl font-bold text-[var(--color-primary)]">
                      {d.name.trim().charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">{d.name}</h3>
                {d.qualifications ? (
                  <p className="mt-0.5 text-sm font-medium text-[var(--color-primary)]">{d.qualifications}</p>
                ) : null}
                {d.specialties ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.specialties.split(',').map((sp) => (
                      <span
                        key={sp.trim()}
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                      >
                        {sp.trim()}
                      </span>
                    ))}
                  </div>
                ) : null}
                {d.yearsExperience ? (
                  <p className="mt-2 text-xs text-slate-400">{d.yearsExperience}+ years experience</p>
                ) : null}
                {d.bio ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{d.bio}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
