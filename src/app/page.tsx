import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Clinic SaaS — run your clinic, control your website',
  description: 'A simple, secure clinic management system with built-in website.',
};

export default function Landing() {
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
