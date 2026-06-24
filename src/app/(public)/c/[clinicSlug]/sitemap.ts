import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getPublicSnapshot } from '@/lib/content';

export default async function sitemap({
  params,
}: {
  params: { clinicSlug: string };
}): Promise<MetadataRoute.Sitemap> {
  const snap = await getPublicSnapshot(params.clinicSlug);
  const root = snap?.clinic.customDomain
    ? `https://${snap.clinic.customDomain}`
    : `${env.APP_URL.replace(/\/$/, '')}/c/${params.clinicSlug}`;

  return [
    { url: root, changeFrequency: 'weekly', priority: 1 },
    { url: `${root}/book`, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
