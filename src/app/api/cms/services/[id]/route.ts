import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = handler<{ id: string }>(
  { action: 'service.update' },
  async (ctx, req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');
    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    for (const k of [
      'name', 'description', 'icon', 'durationMin', 'displayOrder', 'active',
    ]) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    const r = await ctx.tdb.service.updateMany({ where: { id }, data });
    if (r.count === 0) return ctx.notFound();
    await ctx.audit('service.updated', 'Service', id, { fields: Object.keys(data) });
    return ctx.ok({ ok: true });
  }
);

export const DELETE = handler<{ id: string }>(
  { action: 'service.deactivate' },
  async (ctx, _req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');
    const r = await ctx.tdb.service.updateMany({
      where: { id },
      data: { active: false },
    });
    if (r.count === 0) return ctx.notFound();
    await ctx.audit('service.deactivated', 'Service', id);
    return ctx.ok({ ok: true });
  }
);
