import Link from 'next/link';
import Image from 'next/image';
import { type PublicSnapshot, siteContentValue } from '@/lib/content';

export default function Hero({ snap }: { snap: PublicSnapshot }) {
  const headline = snap.settings.heroHeadline;
  const sub = snap.settings.heroSubheadline;
  const heroImg = snap.settings.heroImageUrl;
  const aboutFirstPara = (snap.settings.about || '').split(/\n\n+/)[0] ?? '';
  const phone = snap.settings.phone;
  const badges = siteContentValue<string[]>(snap, 'hero_badges', []);

  // Empty-state: if no headline at all, render minimal placeholder block.
  const showHeading = headline.trim().length > 0;

  return (
    <section id="home" className="bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          {showHeading ? (
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
              {headline}
            </h1>
          ) : (
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-slate-300">
              {snap.settings.clinicName || 'Welcome'}
            </h1>
          )}
          {sub ? <p className="mt-4 text-lg text-slate-600">{sub}</p> : null}
          {aboutFirstPara ? <p className="mt-4 text-slate-600">{aboutFirstPara}</p> : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/c/${snap.clinic.slug}/book`}
              className="px-5 py-3 rounded-2xl text-white bg-[var(--color-primary)] hover:opacity-90"
            >
              Book Appointment
            </Link>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50"
              >
                Call Now
              </a>
            ) : null}
          </div>

          {badges.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-3">
              {badges.map((b) => (
                <li
                  key={b}
                  className="px-3 py-1.5 text-sm rounded-full bg-white border border-slate-200 text-slate-700"
                >
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10">
          {heroImg ? (
            <Image
              src={heroImg}
              alt={snap.settings.clinicName || 'Clinic'}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
