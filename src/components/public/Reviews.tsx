import { type PublicSnapshot, siteContentValue } from '@/lib/content';

export default function Reviews({ snap }: { snap: PublicSnapshot }) {
  const summary = siteContentValue<{ rating?: number; count?: number }>(snap, 'google_rating_summary', {});
  const featured = snap.reviews.filter((r) => r.featured).slice(0, 3);
  const others = snap.reviews.filter((r) => !r.featured).slice(0, 6);
  if (snap.reviews.length === 0) return null;

  return (
    <section id="reviews" className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--color-primary)]">
              Patient Stories
            </div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What Patients Say</h2>
            <p className="mt-2 text-slate-500">Honest words from people we've cared for.</p>
          </div>
          {summary.rating && summary.count ? (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
              <div className="text-3xl font-bold text-amber-600">{summary.rating.toFixed(1)}</div>
              <div>
                <div className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(summary.rating ?? 0) ? '' : 'opacity-30'}>★</span>
                  ))}
                </div>
                <div className="text-xs text-amber-700">{summary.count.toLocaleString()} reviews</div>
              </div>
            </div>
          ) : null}
        </div>

        {featured.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {featured.map((r) => (
              <ReviewCard key={r.id} review={r} highlight />
            ))}
          </div>
        ) : null}

        {others.length > 0 ? (
          <div className={`grid gap-4 sm:grid-cols-2 md:grid-cols-3 ${featured.length > 0 ? 'mt-4' : ''}`}>
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
      className={`relative flex flex-col rounded-2xl border p-5 ${
        highlight
          ? 'border-[var(--color-primary)]/25 bg-white shadow-md shadow-[var(--color-primary)]/5'
          : 'border-slate-100 bg-white shadow-sm'
      }`}
    >
      {/* Open quote decoration */}
      <span className="absolute right-5 top-4 text-5xl leading-none text-slate-100 select-none" aria-hidden="true">
        "
      </span>

      <div className="mb-3 flex text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`text-sm ${i < review.rating ? '' : 'opacity-25'}`}>★</span>
        ))}
      </div>

      <p className="relative flex-1 text-sm leading-relaxed text-slate-700">{review.text}</p>

      <div className="mt-4 flex items-center gap-3 border-t border-slate-50 pt-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-sm font-bold text-[var(--color-primary)]">
          {review.author.trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{review.author}</p>
          {review.source && review.source !== 'manual' ? (
            <p className="text-xs capitalize text-slate-400">{review.source}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
