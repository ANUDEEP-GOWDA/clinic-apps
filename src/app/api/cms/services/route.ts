import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({ action: 'service.read' }, async (ctx) => {
  const services = await ctx.tdb.service.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
  return ctx.ok({ services });
});

export const POST = handler({ action: 'service.create' }, async (ctx, req) => {
  const body = await req.json().catch(() => ({}));
  if (!body.name) return ctx.bad('missing_name');
  const created = await ctx.tdb.service.create({
    data: {
      name: body.name,
      description: body.description ?? '',
      icon: body.icon ?? '',
      durationMin: body.durationMin ?? 15,
      displayOrder: body.displayOrder ?? 0,
      active: body.active ?? true,
    },
  });
  await ctx.audit('service.created', 'Service', created.id);
  return ctx.ok({ ok: true, id: created.id });
});
