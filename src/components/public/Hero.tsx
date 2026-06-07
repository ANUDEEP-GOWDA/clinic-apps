import Link from 'next/link';
import Image from 'next/image';
import { type PublicSnapshot, siteContentValue } from '@/lib/content';

export default function Hero({ snap }: { snap: PublicSnapshot }) {
  const headline = snap.settings.heroHeadline;
  const sub = snap.settings.heroSubheadline;
  const heroImg = snap.settings.heroImageUrl;
  const phone = snap.settings.phone;
  const badges = siteContentValue<string[]>(snap, 'hero_badges', []);
  const rating = siteContentValue<{ rating?: number; count?: number }>(snap, 'google_rating_summary', {});

  const hasHeadline = headline.trim().length > 0;
  const hasRating = rating.rating && rating.count;

  return (
    <section id="home" className="relative overflow-hidden bg-white">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[var(--color-primary)]/6" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-[var(--color-secondary)]/6" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-2 md:gap-16 md:py-24 lg:px-8">
        {/* Left: text */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--color-primary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            Trusted Healthcare
          </div>

          {hasHeadline ? (
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {headline}
            </h1>
          ) : (
            <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
              {snap.settings.clinicName || 'Your Trusted Clinic'}
            </h1>
          )}

          {sub ? <p className="mt-4 text-lg leading-relaxed text-slate-600">{sub}</p> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--color-primary)]/20 transition hover:opacity-90"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                Call Now
              </a>
            ) : null}
            <Link
              href={`/c/${snap.clinic.slug}/book`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 px-6 py-3.5 text-base font-medium text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Book Appointment
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Stats strip */}
          {(hasRating || snap.doctors.length > 0 || snap.services.length > 0) ? (
            <div className="mt-10 flex flex-wrap gap-8 border-t border-slate-100 pt-8">
              {hasRating ? (
                <div>
                  <div className="text-2xl font-bold text-slate-900">{rating.rating?.toFixed(1)} ★</div>
                  <div className="mt-0.5 text-xs text-slate-500">{rating.count?.toLocaleString()}+ reviews</div>
                </div>
              ) : null}
              {snap.doctors.length > 0 ? (
                <div>
                  <div className="text-2xl font-bold text-slate-900">{snap.doctors.length}+</div>
                  <div className="mt-0.5 text-xs text-slate-500">{snap.doctors.length === 1 ? 'Doctor' : 'Doctors'}</div>
                </div>
              ) : null}
              {snap.services.length > 0 ? (
                <div>
                  <div className="text-2xl font-bold text-slate-900">{snap.services.length}+</div>
                  <div className="mt-0.5 text-xs text-slate-500">Services</div>
                </div>
              ) : null}
            </div>
          ) : null}

          {badges.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                  {b}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right: image */}
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-secondary)]/15 shadow-2xl shadow-slate-200">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)]/20">
                  <svg width="36" height="36" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <rect x="24" y="8" width="16" height="48" rx="4" fill="var(--color-primary)" />
                    <rect x="8" y="24" width="48" height="16" rx="4" fill="var(--color-primary)" />
                  </svg>
                </div>
                <span className="text-sm text-slate-400">{snap.settings.clinicName || 'Add a hero image'}</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 -z-10 h-24 w-24 rounded-2xl bg-[var(--color-primary)]/10" />
          <div className="absolute -left-4 -top-4 -z-10 h-16 w-16 rounded-2xl bg-[var(--color-secondary)]/10" />
        </div>
      </div>
    </section>
  );
}
