import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Clinic SaaS — run your clinic, control your website',
  description: 'A simple, secure clinic management system with built-in website.',
};

const SYSTEM_HOST_PARTS = ['railway.app', 'localhost', 'vercel.app'];

export default async function Landing() {
  // If the request came in via a custom clinic domain, redirect to that
  // clinic's public site instead of showing the marketing landing.
  const h = headers();
  const host = (h.get('host') || '').toLowerCase().split(':')[0];
  const isSystemHost = SYSTEM_HOST_PARTS.some((s) => host.endsWith(s));

  if (host && !isSystemHost) {
    const clinic = await prisma.clinic.findUnique({
      where: { customDomain: host },
      select: { slug: true, active: true },
    });
    if (clinic && clinic.active) {
      redirect(`/c/${clinic.slug}`);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-xs uppercase tracking-widest text-slate-500">Clinic SaaS</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          Run your clinic. <br className="hidden md:block" />
          Run your website.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          One simple system for appointments, consultations, patient history, and your public website — editable from the same place you manage your day.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-white font-medium hover:bg-slate-800">
            Create your clinic
          </Link>
          <Link href="/cms/login" className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-5 py-3 text-slate-900 font-medium hover:bg-slate-100">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
