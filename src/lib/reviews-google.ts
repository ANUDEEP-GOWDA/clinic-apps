/**
 * Google Reviews sync — per clinic.
 *
 * Each clinic has its own google_place_id in Settings. Sync hits the
 * Google Places Details API, filters reviews >= 5★, upserts into Review
 * scoped to that clinic.
 */
import { prisma } from './db';
import { env } from './env';

type GoogleReview = {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;
  profile_photo_url?: string;
};

type PlacesDetailsResponse = {
  result?: { reviews?: GoogleReview[] };
  status?: string;
  error_message?: string;
};

export async function syncGoogleReviews(opts: { clinicId: number }): Promise<{
  ok: boolean;
  upserted: number;
  error?: string;
}> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const settings = await prisma.settings.findUnique({
    where: { clinicId: opts.clinicId },
  });
  const placeId = settings?.googlePlaceId;
  if (!apiKey || !placeId) {
    return { ok: false, upserted: 0, error: 'not_configured' };
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'reviews');
  url.searchParams.set('key', apiKey);

  let json: PlacesDetailsResponse;
  try {
    const res = await fetch(url.toString());
    json = (await res.json()) as PlacesDetailsResponse;
  } catch (e) {
    return { ok: false, upserted: 0, error: (e as Error).message };
  }
  if (json.status && json.status !== 'OK') {
    return { ok: false, upserted: 0, error: json.error_message || json.status };
  }
  const reviews = json.result?.reviews ?? [];

  let upserted = 0;
  for (const r of reviews) {
    if (!r.rating || r.rating < 5) continue;
    const reviewedAt = r.time ? new Date(r.time * 1000) : new Date();
    const googleReviewId = `gr_${r.time ?? ''}_${(r.author_name ?? '').slice(0, 12)}`;
    await prisma.review.upsert({
      where: {
        clinicId_googleReviewId: {
          clinicId: opts.clinicId,
          googleReviewId,
        },
      },
      update: {
        author: r.author_name ?? 'Anonymous',
        rating: r.rating,
        text: r.text ?? '',
        reviewedAt,
        authorPhotoUrl: r.profile_photo_url ?? '',
      },
      create: {
        clinicId: opts.clinicId,
        source: 'google',
        author: r.author_name ?? 'Anonymous',
        rating: r.rating,
        text: r.text ?? '',
        reviewedAt,
        googleReviewId,
        authorPhotoUrl: r.profile_photo_url ?? '',
        featured: false,
        displayOrder: 0,
      },
    });
    upserted++;
  }

  return { ok: true, upserted };
}
