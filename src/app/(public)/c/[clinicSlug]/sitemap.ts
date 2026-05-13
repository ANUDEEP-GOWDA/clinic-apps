import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function sitemap({
  params,
}: {
  params: { clinicSlug: string };
}): MetadataRoute.Sitemap {
  const base = env.APP_URL.replace(/\/$/, '');
  const root = `${base}/c/${params.clinicSlug}`;
  return [
    { url: root, changeFrequency: 'weekly', priority: 1 },
    { url: `${root}/book`, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
