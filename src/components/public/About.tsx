import Image from 'next/image';
import { type PublicSnapshot, siteContentValue } from '@/lib/content';

export default function About({ snap }: { snap: PublicSnapshot }) {
  const about = snap.settings.about;
  const aboutImg = siteContentValue<string>(snap, 'about_image_url', '');
  const bullets = siteContentValue<string[]>(snap, 'about_bullets', []);
  if (!about && bullets.length === 0 && !aboutImg) return null;

  const paragraphs = about ? about.split(/\n\n+/).filter(Boolean) : [];

  return (
    <section id="about" className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
          {aboutImg ? (
            <Image src={aboutImg} alt="About the clinic" fill sizes="50vw" className="object-cover" />
          ) : null}
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">About Us</h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="mt-4 text-slate-600">
              {p}
            </p>
          ))}
          {bullets.length > 0 ? (
            <ul className="mt-6 space-y-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
