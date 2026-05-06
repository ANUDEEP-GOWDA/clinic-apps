/**
 * SEO helpers.
 *
 * generateMetadata in (public)/page.tsx pulls from Settings + site_content
 * via getPublicSnapshot(). All fields gracefully fall back when missing.
 *
 * JSON-LD: emits MedicalClinic + Physician (per active doctor) + Review +
 * FAQPage. Injected via <script type="application/ld+json"> in the public
 * layout.
 */

import type { Metadata } from 'next';
import { type PublicSnapshot, siteContentValue } from './content';
import { parseWorkingHours, toOpeningHoursSpec } from './working-hours';
import { env } from './env';

function siteUrl(snap: PublicSnapshot): string {
  const base = env.APP_URL.replace(/\/$/, '');
  return `${base}/c/${snap.clinic.slug}`;
}

/**
 * Auto-suggest title/description from clinic name + address + services
 * when CMS fields are empty.
 */
function autoTitle(snap: PublicSnapshot): string {
  const name = snap.settings.clinicName || 'Clinic';
  const tagline = snap.settings.tagline;
  return tagline ? `${name} — ${tagline}` : name;
}

function autoDescription(snap: PublicSnapshot): string {
  const name = snap.settings.clinicName || 'our clinic';
  const services = snap.services.map((s) => s.name).slice(0, 4).join(', ');
  const where = snap.settings.address ? ` in ${snap.settings.address.split(',')[0]}` : '';
  if (services) return `${name}${where} — ${services} and more. Book an appointment online.`;
  return `${name}${where}. Book an appointment online.`;
}

export function buildMetadata(snap: PublicSnapshot): Metadata {
  const title =
    siteContentValue<string>(snap, 'seo_default_title', '') || autoTitle(snap);
  const description =
    siteContentValue<string>(snap, 'seo_default_description', '') ||
    autoDescription(snap);
  const keywords = siteContentValue<string>(snap, 'seo_keywords', '');
  const url = siteUrl(snap);
  const og = snap.settings.heroImageUrl;

  const md: Metadata = {
    title,
    description,
    metadataBase: url ? new URL(url) : undefined,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      url: url || undefined,
      siteName: snap.settings.clinicName || undefined,
      images: og ? [{ url: og }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: og ? [og] : undefined,
    },
    icons: snap.settings.faviconUrl ? { icon: snap.settings.faviconUrl } : undefined,
  };
  if (keywords) md.keywords = keywords;
  return md;
}

/**
 * Build a JSON-LD blob (an array of @graph entities) describing the clinic.
 */
export function buildJsonLd(snap: PublicSnapshot): Record<string, unknown> {
  const url = siteUrl(snap);
  const wh = parseWorkingHours(snap.settings.workingHours);
  const opening = toOpeningHoursSpec(wh);

  const ratingSummary = siteContentValue<{ rating?: number; count?: number }>(
    snap,
    'google_rating_summary',
    {}
  );
  const faq = siteContentValue<Array<{ question: string; answer: string }>>(snap, 'faq', []);

  const clinic: Record<string, unknown> = {
    '@type': 'MedicalClinic',
    '@id': url ? `${url}#clinic` : undefined,
    name: snap.settings.clinicName || undefined,
    url: url || undefined,
    telephone: snap.settings.phone || undefined,
    email: snap.settings.email || undefined,
    image: snap.settings.heroImageUrl || snap.settings.logoUrl || undefined,
    address: snap.settings.address
      ? { '@type': 'PostalAddress', streetAddress: snap.settings.address }
      : undefined,
    geo:
      snap.settings.latitude && snap.settings.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: snap.settings.latitude,
            longitude: snap.settings.longitude,
          }
        : undefined,
    openingHoursSpecification: opening.length ? opening : undefined,
    aggregateRating:
      ratingSummary.rating && ratingSummary.count
        ? {
            '@type': 'AggregateRating',
            ratingValue: ratingSummary.rating,
            reviewCount: ratingSummary.count,
          }
        : undefined,
  };

  const physicians = snap.doctors.map((d) => ({
    '@type': 'Physician',
    name: d.name,
    image: d.photoUrl || undefined,
    description: d.bio || undefined,
    medicalSpecialty: d.specialties || undefined,
    worksFor: clinic['@id']
      ? { '@id': clinic['@id'] }
      : { '@type': 'MedicalClinic', name: snap.settings.clinicName },
  }));

  const reviews = snap.reviews.slice(0, 20).map((r) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.author },
    reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
    reviewBody: r.text,
    datePublished: r.reviewedAt,
    itemReviewed: clinic['@id']
      ? { '@id': clinic['@id'] }
      : { '@type': 'MedicalClinic', name: snap.settings.clinicName },
  }));

  const faqEntity = faq.length
    ? {
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  const graph: Array<Record<string, unknown>> = [stripUndefined(clinic), ...physicians, ...reviews];
  if (faqEntity) graph.push(faqEntity);

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function stripUndefined<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}
