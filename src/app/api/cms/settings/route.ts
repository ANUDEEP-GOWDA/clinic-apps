import { handler } from '@/lib/route-handler';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = [
  'clinicName', 'tagline', 'about', 'address', 'phone', 'email',
  'googlePlaceId', 'googleMapsUrl', 'latitude', 'longitude', 'timezone',
  'workingHours', 'themeConfig', 'logoUrl', 'faviconUrl', 'heroImageUrl',
  'heroHeadline', 'heroSubheadline',
];

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.[a-z0-9-]{1,63})+$/i;

export const GET = handler({ action: 'settings.read' }, async (ctx) => {
  const settings = await ctx.tdb.settings.findFirst();
  return ctx.ok({ settings });
});

export const PATCH = handler({ action: 'settings.update' }, async (ctx, req) => {
  const body = await req.json().catch(() => ({}));
  const clinicId = ctx.session.clinicId;

  // ---- Handle customDomain (lives on Clinic, not Settings) ----
  if (body.customDomain !== undefined) {
    const incoming = typeof body.customDomain === 'string'
      ? body.customDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      : null;

    if (incoming && !DOMAIN_RE.test(incoming)) {
      return NextResponse.json({ ok: false, error: 'invalid_domain' }, { status: 400 });
    }
    if (incoming) {
      const conflict = await prisma.clinic.findFirst({
        where: { customDomain: incoming, NOT: { id: clinicId } },
        select: { id: true },
      });
      if (conflict) {
        return NextResponse.json({ ok: false, error: 'domain_taken' }, { status: 400 });
      }
    }
    await prisma.clinic.update({
      where: { id: clinicId },
      data: { customDomain: incoming || null },
    });
    await ctx.audit('clinic.domain_updated', 'Clinic', clinicId, { customDomain: incoming });
  }

  // ---- Handle settings fields ----
  const data: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  for (const k of ['workingHours', 'themeConfig']) {
    if (typeof data[k] === 'string') {
      try { data[k] = JSON.parse(data[k] as string); } catch { data[k] = {}; }
    }
  }

  if (Object.keys(data).length > 0) {
    await prisma.settings.upsert({
      where: { clinicId },
      update: data,
      create: { clinicId, ...data } as never,
    });
    await ctx.audit('settings.updated', 'Settings', null, { fields: Object.keys(data) });
  }

  return ctx.ok({ ok: true });
});
