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

  return (
    <main>
      <Header snap={snap} />
      <Hero snap={snap} />
      <Services snap={snap} />
      <Doctors snap={snap} />
      <About snap={snap} />
      <WhyChooseUs snap={snap} />
      <Reviews snap={snap} />
      <Location snap={snap} />
      <Footer snap={snap} />
    </main>
  );
}
