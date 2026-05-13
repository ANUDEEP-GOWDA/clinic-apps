import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots({
  params,
}: {
  params: { clinicSlug: string };
}): MetadataRoute.Robots {
  const base = env.APP_URL.replace(/\/$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/cms/', '/api/'] }],
    sitemap: `${base}/c/${params.clinicSlug}/sitemap.xml`,
  };
}
