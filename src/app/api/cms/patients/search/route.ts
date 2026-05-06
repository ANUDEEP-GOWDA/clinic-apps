import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({ action: 'patient.read' }, async (ctx, req) => {
  const q = (new URL(req.url).searchParams.get('q') || '').trim();
  if (!q) return ctx.ok({ items: [] });

  // Postgres `contains` is case-sensitive by default; use `mode: insensitive`
  // for natural search behavior.
  const items = await ctx.tdb.patient.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ],
    },
    select: { id: true, name: true, phone: true },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  });
  return ctx.ok({ items });
});
