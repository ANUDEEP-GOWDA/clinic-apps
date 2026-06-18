import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AccountSecurityClient from '@/components/cms/AccountSecurity';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  let session: Awaited<ReturnType<typeof requireSession>>;
  try { session = await requireSession(); } catch { redirect('/cms/login'); }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { mfaEnabled: true, emailVerified: true, email: true },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Account &amp; Security</h1>
      <AccountSecurityClient
        mfaEnabled={user?.mfaEnabled ?? false}
        emailVerified={user?.emailVerified ?? false}
        email={user?.email ?? session.email}
      />
    </div>
  );
}
