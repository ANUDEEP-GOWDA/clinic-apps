/**
 * Helper for tenant-scoped server components.
 *
 * Use in CMS server pages instead of importing `prisma` directly:
 *
 *   const { tdb, session } = await ssrTenant();
 *   const patients = await tdb.patient.findMany();
 *
 * If the user isn't authenticated, redirects to /cms/login. Pages should
 * never reach a render path where session is missing.
 */
import { redirect } from 'next/navigation';
import { requireSession } from './auth';
import { tenantPrisma } from './tenant-prisma';

export async function ssrTenant() {
  try {
    const session = await requireSession();
    const tdb = tenantPrisma(session.clinicId);
    return { session, tdb };
  } catch {
    redirect('/cms/login');
  }
}
