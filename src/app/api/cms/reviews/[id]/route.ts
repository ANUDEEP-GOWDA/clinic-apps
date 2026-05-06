import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = handler<{ id: string }>(
  { action: 'review.update' },
  async (ctx, req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');
    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    for (const k of ['author', 'rating', 'text', 'featured', 'displayOrder']) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    if (body.reviewedAt) data.reviewedAt = new Date(body.reviewedAt);
    const r = await ctx.tdb.review.updateMany({ where: { id }, data });
    if (r.count === 0) return ctx.notFound();
    await ctx.audit('review.updated', 'Review', id);
    return ctx.ok({ ok: true });
  }
);

/**
 * Hide-from-public is "featured: false". We don't expose hard delete; if a
 * review must vanish entirely (defamation, abuse), do it via DB.
 */
export const DELETE = handler<{ id: string }>(
  { action: 'review.deactivate' },
  async (ctx, _req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');
    const r = await ctx.tdb.review.updateMany({
      where: { id },
      data: { featured: false, displayOrder: 9999 },
    });
    if (r.count === 0) return ctx.notFound();
    await ctx.audit('review.deactivated', 'Review', id);
    return ctx.ok({ ok: true });
  }
);
