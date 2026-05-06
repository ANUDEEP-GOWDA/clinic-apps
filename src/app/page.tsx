import Link from 'next/link';

export const metadata = {
  title: 'Clinic SaaS — run your clinic, control your website',
  description:
    'A simple, secure clinic management system with built-in website. Deployable in minutes.',
};

export default function Landing() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-xs uppercase tracking-widest text-slate-500">
          Clinic SaaS
        </div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          Run your clinic. <br className="hidden md:block" />
          Run your website.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          One simple system for appointments, consultations, patient
          history, and your public website — editable from the same place
          you manage your day.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-white font-medium hover:bg-slate-800"
          >
            Create your clinic
          </Link>
          <Link
            href="/cms/login"
            className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-5 py-3 text-slate-900 font-medium hover:bg-slate-100"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Card title="Card-based workflow">
            Every appointment, consultation, and follow-up is one Card moving
            through a simple state machine. No 20-table mess.
          </Card>
          <Card title="Your website, your CMS">
            Edit your public site — hero, services, doctors, reviews — from
            the same dashboard you use to see today&apos;s schedule.
          </Card>
          <Card title="Built for SaaS">
            Multi-tenant from day one. Postgres. Cloud-deployable. Each
            clinic&apos;s data fully isolated.
          </Card>
        </div>

        <div className="mt-20 text-sm text-slate-500">
          Already have a clinic? Visit{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
            /c/&lt;your-slug&gt;
          </code>{' '}
          for the public page, or{' '}
          <Link href="/cms/login" className="underline">
            /cms/login
          </Link>{' '}
          to sign in.
        </div>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{children}</p>
    </div>
  );
}
