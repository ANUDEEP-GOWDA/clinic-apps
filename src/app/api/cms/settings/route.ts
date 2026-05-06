import { handler } from '@/lib/route-handler';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = [
  'clinicName', 'tagline', 'about', 'address', 'phone', 'email',
  'googlePlaceId', 'googleMapsUrl', 'latitude', 'longitude', 'timezone',
  'workingHours', 'themeConfig', 'logoUrl', 'faviconUrl', 'heroImageUrl',
  'heroHeadline', 'heroSubheadline',
];

export const GET = handler({ action: 'settings.read' }, async (ctx) => {
  const settings = await ctx.tdb.settings.findFirst();
  return ctx.ok({ settings });
});

export const PATCH = handler({ action: 'settings.update' }, async (ctx, req) => {
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  // The editor UI sends `workingHours` and `themeConfig` as JSON-stringified
  // strings (legacy from the v1 string-typed columns). The columns are now
  // JSONB; parse strings back into objects so they're stored correctly.
  for (const k of ['workingHours', 'themeConfig']) {
    if (typeof data[k] === 'string') {
      try { data[k] = JSON.parse(data[k] as string); }
      catch { data[k] = {}; }
    }
  }

  const clinicId = ctx.session.clinicId;
  await prisma.settings.upsert({
    where: { clinicId },
    update: data,
    create: { clinicId, ...data } as never,
  });

  await ctx.audit('settings.updated', 'Settings', null, {
    fields: Object.keys(data),
  });
  return ctx.ok({ ok: true });
});
