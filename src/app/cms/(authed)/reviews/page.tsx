import { ssrTenant } from '@/lib/ssr-tenant';
import ReviewEditor from '@/components/cms/ReviewEditor';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const { tdb } = await ssrTenant();
  const reviews = await tdb.review.findMany({
    orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { reviewedAt: 'desc' }],
  });
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Reviews</h1>
      <ReviewEditor
        reviews={reviews.map((r) => ({
          id: r.id,
          source: r.source,
          author: r.author,
          rating: r.rating,
          text: r.text,
          reviewedAt: r.reviewedAt.toISOString(),
          featured: r.featured,
          displayOrder: r.displayOrder,
        }))}
      />
    </div>
  );
}
