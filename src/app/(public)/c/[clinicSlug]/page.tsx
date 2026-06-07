import { notFound } from 'next/navigation';
import { getPublicSnapshot } from '@/lib/content';
import Header from '@/components/public/Header';
import Hero from '@/components/public/Hero';
import Services from '@/components/public/Services';
import Doctors from '@/components/public/Doctors';
import About from '@/components/public/About';
import WhyChooseUs from '@/components/public/WhyChooseUs';
import Reviews from '@/components/public/Reviews';
import Location from '@/components/public/Location';
import Footer from '@/components/public/Footer';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  params,
}: {
  params: { clinicSlug: string };
}) {
  const snap = await getPublicSnapshot(params.clinicSlug);
  if (!snap) notFound();

  const phone = snap.settings.phone;

  return (
    <main className={phone ? 'pb-16 md:pb-0' : ''}>
      <Header snap={snap} />
      <Hero snap={snap} />
      <Services snap={snap} />
      <Doctors snap={snap} />
      <About snap={snap} />
      <WhyChooseUs snap={snap} />
      <Reviews snap={snap} />
      <Location snap={snap} />
      <Footer snap={snap} />

      {phone ? (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-white border-t border-slate-200 shadow-lg">
          <a
            href={`tel:${phone}`}
            className="block w-full py-3 rounded-2xl text-white bg-[var(--color-primary)] text-center font-semibold text-base"
          >
            📞 Call Now — {phone}
          </a>
        </div>
      ) : null}
    </main>
  );
}
