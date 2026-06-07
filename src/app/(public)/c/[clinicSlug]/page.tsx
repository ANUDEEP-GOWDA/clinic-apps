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
    <main className={`bg-white text-slate-900 antialiased${phone ? ' pb-20 md:pb-0' : ''}`}>

      <Header snap={snap} />
      <Hero snap={snap} />
      <Services snap={snap} />
      <Doctors snap={snap} />
      <About snap={snap} />
      <WhyChooseUs snap={snap} />
      <Reviews snap={snap} />
      <Location snap={snap} />
      <Footer snap={snap} />

      {/* MOBILE CALL BAR */}
      {phone ? (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg shadow-lg">
          <div className="px-4 py-3">
            <a
              href={`tel:${phone}`}
              className="block w-full py-3 rounded-2xl text-white bg-slate-900 text-center font-semibold text-base active:scale-[0.99] transition"
            >
              📞 Call Now — {phone}
            </a>
          </div>
        </div>
      ) : null}
    </main>
  );
}