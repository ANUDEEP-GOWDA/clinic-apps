import Image from 'next/image';
import type { PublicSnapshot } from '@/lib/content';

export default function Doctors({ snap }: { snap: PublicSnapshot }) {
  if (snap.doctors.length === 0) return null;
  return (
    <section id="doctors" className="py-10 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold">Our Doctors</h2>
        <p className="mt-2 text-slate-600">Meet the team caring for you.</p>
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {snap.doctors.map((d) => (
            <div key={d.id} className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
              <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center">
                {d.photoUrl ? (
                  <Image src={d.photoUrl} alt={d.name} fill sizes="33vw" className="object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--color-primary)]">
                      {d.name.trim().charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5 min-w-0">
                <h3 className="text-lg font-semibold">{d.name}</h3>
                {d.qualifications ? (
                  <p className="text-sm text-slate-600">{d.qualifications}</p>
                ) : null}
                {d.specialties ? (
                  <p className="text-sm text-slate-500 mt-1">{d.specialties}</p>
                ) : null}
                {d.yearsExperience ? (
                  <p className="text-xs text-slate-500 mt-2">
                    {d.yearsExperience}+ years experience
                  </p>
                ) : null}
                {d.bio ? (
                  <p className="text-sm mt-3 text-slate-600 line-clamp-3">{d.bio}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
