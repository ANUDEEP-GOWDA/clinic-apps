import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getPublicSnapshot } from '@/lib/content';

export default async function robots({
  params,
}: {
  params: { clinicSlug: string };
}): Promise<MetadataRoute.Robots> {
  const snap = await getPublicSnapshot(params.clinicSlug);
  const root = snap?.clinic.customDomain
    ? `https://${snap.clinic.customDomain}`
    : `${env.APP_URL.replace(/\/$/, '')}/c/${params.clinicSlug}`;

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/cms/', '/api/'] }],
    sitemap: `${root}/sitemap.xml`,
  };
}
