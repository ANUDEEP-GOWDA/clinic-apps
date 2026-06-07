import Image from 'next/image';
import { type PublicSnapshot, siteContentValue } from '@/lib/content';

export default function About({ snap }: { snap: PublicSnapshot }) {
  const about = snap.settings.about;
  const aboutImg = siteContentValue<string>(snap, 'about_image_url', '');
  const bullets = siteContentValue<string[]>(snap, 'about_bullets', []);

  if (!about && bullets.length === 0 && !aboutImg) return null;

  const paragraphs = about ? about.split(/\n\n+/).filter(Boolean) : [];

  return (
    <section id="about" className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className={aboutImg ? 'grid items-center gap-12 md:grid-cols-2' : ''}>
          {aboutImg ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl shadow-slate-200">
              <Image src={aboutImg} alt="About the clinic" fill sizes="50vw" className="object-cover" />
            </div>
          ) : null}

          <div className={aboutImg ? '' : 'mx-auto max-w-3xl'}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--color-primary)]">
              About Us
            </div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {snap.settings.clinicName || 'Our Clinic'}
            </h2>

            {paragraphs.map((p, i) => (
              <p key={i} className="mt-4 leading-relaxed text-slate-600">
                {p}
              </p>
            ))}

            {bullets.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-sm text-[var(--color-primary)]">
                      ✓
                    </span>
                    <span className="text-slate-700">{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
