import { type PublicSnapshot, siteContentValue } from '@/lib/content';

export default function Reviews({ snap }: { snap: PublicSnapshot }) {
  const summary = siteContentValue<{ rating?: number; count?: number }>(
    snap,
    'google_rating_summary',
    {}
  );
  const featured = snap.reviews.filter((r) => r.featured).slice(0, 3);
  const others = snap.reviews.filter((r) => !r.featured).slice(0, 6);
  if (snap.reviews.length === 0 && !summary.rating) return null;

  return (
    <section id="reviews" className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">What Patients Say</h2>
            <p className="mt-2 text-slate-600">Honest words from people we&apos;ve cared for.</p>
          </div>
          {summary.rating && summary.count ? (
            <div className="text-right">
              <div className="text-3xl font-bold text-[var(--color-primary)]">
                {summary.rating.toFixed(1)} ★
              </div>
              <div className="text-sm text-slate-600">{summary.count} reviews</div>
            </div>
          ) : null}
        </div>

        {featured.length > 0 ? (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {featured.map((r) => (
              <ReviewCard key={r.id} review={r} highlight />
            ))}
          </div>
        ) : null}

        {others.length > 0 ? (
          <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {others.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReviewCard({
  review,
  highlight,
}: {
  review: PublicSnapshot['reviews'][number];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight ? 'border-[var(--color-primary)]/30 bg-white shadow-sm' : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex items-center gap-2 text-amber-500">
        {Array.from({ length: review.rating }).map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
      <p className="mt-3 text-slate-700 text-sm">{review.text}</p>
      <p className="mt-4 text-sm font-medium">— {review.author}</p>
    </div>
  );
}
