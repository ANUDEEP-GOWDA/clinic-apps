import { handler } from '@/lib/route-handler';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<{ key: string }>(
  { action: 'website.read' },
  async (ctx, _req, params) => {
    const row = await ctx.tdb.siteContent.findFirst({
      where: { key: params.key },
    });
    return ctx.ok({ key: params.key, value: row?.value ?? null });
  }
);

export const PUT = handler<{ key: string }>(
  { action: 'website.update' },
  async (ctx, req, params) => {
    const body = await req.json().catch(() => ({}));
    const value = body.value ?? {};

    // Composite unique requires raw prisma upsert; clinicId injected explicitly.
    const clinicId = ctx.session.clinicId;
    await prisma.siteContent.upsert({
      where: { clinicId_key: { clinicId, key: params.key } },
      update: { value },
      create: { clinicId, key: params.key, value },
    });

    await ctx.audit('site_content.updated', 'SiteContent', null, {
      key: params.key,
    });
    return ctx.ok({ ok: true });
  }
);
