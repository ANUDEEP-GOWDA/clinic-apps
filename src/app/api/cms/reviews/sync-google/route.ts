import { handler } from '@/lib/route-handler';
import { syncGoogleReviews } from '@/lib/reviews-google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handler({ action: 'review.update' }, async (ctx) => {
  const r = await syncGoogleReviews({ clinicId: ctx.session.clinicId });
  await ctx.audit('review.sync_google', 'Review', null, r as unknown as Record<string, unknown>);
  return ctx.ok(r);
});
