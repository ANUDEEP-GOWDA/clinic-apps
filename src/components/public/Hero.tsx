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

  const showHeading = headline.trim().length > 0;

  return (
    <section id="home" className="bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="order-first">
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

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl text-white bg-[var(--color-primary)] hover:opacity-90 text-center font-semibold text-base"
              >
                📞 Call Now
              </a>
            ) : null}
            <Link
              href={`/c/${snap.clinic.slug}/book`}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-center text-sm"
            >
              Book Appointment
            </Link>
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

        <div className="order-last relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20">
          {heroImg ? (
            <Image
              src={heroImg}
              alt={snap.settings.clinicName || 'Clinic'}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                className="opacity-30"
                aria-hidden="true"
              >
                <rect x="24" y="8" width="16" height="48" rx="4" fill="currentColor" className="text-[var(--color-primary)]" />
                <rect x="8" y="24" width="48" height="16" rx="4" fill="currentColor" className="text-[var(--color-primary)]" />
              </svg>
              <span className="text-lg font-semibold opacity-40 text-center px-4">
                {snap.settings.clinicName || 'Clinic'}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
