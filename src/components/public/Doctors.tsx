import Image from 'next/image';
import type { PublicSnapshot } from '@/lib/content';

export default function Doctors({ snap }: { snap: PublicSnapshot }) {
  if (snap.doctors.length === 0) return null;
  return (
    <section id="doctors" className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold">Our Doctors</h2>
        <p className="mt-2 text-slate-600">Meet the team caring for you.</p>
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {snap.doctors.map((d) => (
            <div key={d.id} className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
              <div className="relative aspect-[4/3] bg-slate-100">
                {d.photoUrl ? (
                  <Image src={d.photoUrl} alt={d.name} fill sizes="33vw" className="object-cover" />
                ) : null}
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{d.name}</h3>
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
