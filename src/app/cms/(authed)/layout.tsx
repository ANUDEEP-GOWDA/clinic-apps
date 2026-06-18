import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CmsShell from '@/components/cms/CmsShell';

export const dynamic = 'force-dynamic';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId || !session.clinicId) redirect('/cms/login');

  const [clinic, user] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: session.clinicId },
      select: { slug: true, customDomain: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true },
    }),
  ]);

  return (
    <CmsShell
      user={{
        name: session.name ?? '',
        email: session.email ?? '',
        role: session.role ?? 'STAFF',
      }}
      clinicSlug={clinic?.slug ?? ''}
      customDomain={clinic?.customDomain ?? null}
      emailVerified={user?.emailVerified ?? true}
    >
      {children}
    </CmsShell>
  );
}
