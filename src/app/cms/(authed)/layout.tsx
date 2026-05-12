import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CmsShell from '@/components/cms/CmsShell';

export const dynamic = 'force-dynamic';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId || !session.clinicId) redirect('/cms/login');

  // Fetch current custom domain (if set) so the "View Public Site" button
  // can prefer the custom domain over the slug URL.
  const clinic = await prisma.clinic.findUnique({
    where: { id: session.clinicId },
    select: { slug: true, customDomain: true },
  });

  return (
    <CmsShell
      user={{
        name: session.name ?? '',
        email: session.email ?? '',
        role: session.role ?? 'STAFF',
      }}
      clinicSlug={clinic?.slug ?? ''}
      customDomain={clinic?.customDomain ?? null}
    >
      {children}
    </CmsShell>
  );
}
