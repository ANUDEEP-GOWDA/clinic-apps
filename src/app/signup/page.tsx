import Link from 'next/link';
import SignupForm from '@/components/public/SignupForm';

export const metadata = {
  title: 'Create your clinic',
  description: 'Start a new clinic on the platform.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Create your clinic</h1>
        <p className="mt-2 text-slate-600">
          Set up your clinic, then sign in to start managing appointments and
          your public website.
        </p>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <SignupForm />
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/cms/login" className="underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
