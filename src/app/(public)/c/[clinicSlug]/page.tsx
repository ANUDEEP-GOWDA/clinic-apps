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
    <main className="bg-white text-slate-900 antialiased">
      
      {/* Global page container for better readability */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">

        <Header snap={snap} />

        {/* HERO - strongest visual weight */}
        <section className="pt-6 md:pt-10 pb-14 md:pb-20">
          <Hero snap={snap} />
        </section>

        {/* SERVICES */}
        <section className="py-14 md:py-20 bg-slate-50 rounded-3xl">
          <Services snap={snap} />
        </section>

        {/* DOCTORS */}
        <section className="py-14 md:py-20">
          <Doctors snap={snap} />
        </section>

        {/* ABOUT */}
        <section className="py-14 md:py-20 bg-slate-50 rounded-3xl">
          <About snap={snap} />
        </section>

        {/* WHY CHOOSE US */}
        <section className="py-14 md:py-20">
          <WhyChooseUs snap={snap} />
        </section>

        {/* REVIEWS */}
        <section className="py-14 md:py-20 bg-slate-50 rounded-3xl">
          <Reviews snap={snap} />
        </section>

        {/* LOCATION */}
        <section className="py-14 md:py-20">
          <Location snap={snap} />
        </section>

        {/* FOOTER */}
        <section className="pt-16 pb-10">
          <Footer snap={snap} />
        </section>

      </div>

      {/* MOBILE CALL BAR - improved UX */}
      {phone ? (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3">
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