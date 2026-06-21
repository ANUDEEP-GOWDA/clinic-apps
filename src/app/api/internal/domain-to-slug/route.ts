/**
 * GET /api/internal/domain-to-slug?host=littleheartclinic.com
 *
 * Called only by middleware.ts to resolve a custom domain to a clinic slug.
 * Not authenticated — returns minimal data (slug + active only).
 * Protected by only being called from within the same Railway deployment.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const host = (new URL(req.url).searchParams.get('host') ?? '').toLowerCase().trim();
  if (!host) return NextResponse.json({ slug: null });

  const clinic = await prisma.clinic.findUnique({
    where: { customDomain: host },
    select: { slug: true, active: true },
  });

  if (!clinic || !clinic.active) return NextResponse.json({ slug: null });
  return NextResponse.json({ slug: clinic.slug });
}
