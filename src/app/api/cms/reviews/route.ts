import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({ action: 'review.read' }, async (ctx) => {
  const reviews = await ctx.tdb.review.findMany({
    orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { reviewedAt: 'desc' }],
  });
  return ctx.ok({ reviews });
});

export const POST = handler({ action: 'review.create' }, async (ctx, req) => {
  const body = await req.json().catch(() => ({}));
  if (!body.author || !body.text) return ctx.bad('missing_fields');
  const created = await ctx.tdb.review.create({
    data: {
      source: body.source ?? 'manual',
      author: body.author,
      rating: body.rating ?? 5,
      text: body.text,
      reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : new Date(),
      featured: !!body.featured,
      displayOrder: body.displayOrder ?? 0,
    },
  });
  await ctx.audit('review.created', 'Review', created.id);
  return ctx.ok({ ok: true, id: created.id });
});
