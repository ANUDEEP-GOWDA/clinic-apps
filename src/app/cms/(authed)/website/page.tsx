import { ssrTenant } from '@/lib/ssr-tenant';
import { parseTheme } from '@/lib/theme';
import WebsiteBuilder from '@/components/cms/WebsiteBuilder';

export const dynamic = 'force-dynamic';

async function getContent<T>(
  tdb: Awaited<ReturnType<typeof ssrTenant>>['tdb'],
  key: string,
  fallback: T,
): Promise<T> {
  const row = await tdb.siteContent.findFirst({ where: { key } });
  if (!row) return fallback;
  return (row.value as T) ?? fallback;
}

async function getString(
  tdb: Awaited<ReturnType<typeof ssrTenant>>['tdb'],
  key: string,
): Promise<string> {
  const v = await getContent<unknown>(tdb, key, '');
  return typeof v === 'string' ? v : '';
}

export default async function WebsitePage() {
  const { tdb } = await ssrTenant();

  const [
    settings,
    heroBadges,
    aboutImageUrl,
    aboutBullets,
    whyChooseUs,
    faq,
    googleRating,
    footerTagline,
    serviceAreas,
    seoTitle,
    seoDescription,
    seoKeywords,
    clinic,
  ] = await Promise.all([
    tdb.settings.findFirst(),
    getContent<string[]>(tdb, 'hero_badges', []),
    getString(tdb, 'about_image_url'),
    getContent<string[]>(tdb, 'about_bullets', []),
    getContent<{ icon: string; title: string; description: string }[]>(tdb, 'why_choose_us', []),
    getContent<{ question: string; answer: string }[]>(tdb, 'faq', []),
    getContent<{ rating: number; count: number }>(tdb, 'google_rating_summary', { rating: 0, count: 0 }),
    getString(tdb, 'footer_tagline'),
    getContent<string[]>(tdb, 'service_areas', []),
    getString(tdb, 'seo_default_title'),
    getString(tdb, 'seo_default_description'),
    getString(tdb, 'seo_keywords'),
    tdb.clinic.findFirst({ select: { slug: true } }),
  ]);

  const theme = parseTheme(settings?.themeConfig ?? '{}');

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Website Builder</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit your public site content and see a live preview on the right.
        </p>
      </div>
      <WebsiteBuilder
        initial={{
          clinicSlug: clinic?.slug ?? '',
          settings: {
            heroHeadline: settings?.heroHeadline ?? '',
            heroSubheadline: settings?.heroSubheadline ?? '',
            heroImageUrl: settings?.heroImageUrl ?? '',
            about: settings?.about ?? '',
            logoUrl: settings?.logoUrl ?? '',
            faviconUrl: settings?.faviconUrl ?? '',
          },
          theme,
          heroBadges,
          aboutImageUrl,
          aboutBullets,
          whyChooseUs,
          faq,
          googleRating: { rating: googleRating?.rating ?? 0, count: googleRating?.count ?? 0 },
          footerTagline,
          serviceAreas,
          seoTitle,
          seoDescription,
          seoKeywords,
        }}
      />
    </div>
  );
}
