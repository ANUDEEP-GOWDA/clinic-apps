import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import CmsShell from '@/components/cms/CmsShell';

export const dynamic = 'force-dynamic';

/**
 * Wraps every /cms/* page EXCEPT /cms/login (which lives in the (auth)
 * sibling group). Enforces session and renders the shell.
 */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect('/cms/login');
  return (
    <CmsShell
      user={{
        name: session.name ?? '',
        email: session.email ?? '',
        role: session.role ?? 'STAFF',
      }}
    >
      {children}
    </CmsShell>
  );
}
