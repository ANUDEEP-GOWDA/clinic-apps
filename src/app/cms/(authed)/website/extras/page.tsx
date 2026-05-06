import { ssrTenant } from '@/lib/ssr-tenant';
import StringListEditor from '@/components/cms/StringListEditor';
import FooterTaglineEditor from '@/components/cms/FooterTaglineEditor';
import RatingSummaryEditor from '@/components/cms/RatingSummaryEditor';
import WebsiteTabs from '@/components/cms/WebsiteTabs';

export const dynamic = 'force-dynamic';

async function getJson<T>(
  tdb: Awaited<ReturnType<typeof ssrTenant>>['tdb'],
  key: string,
  fb: T
): Promise<T> {
  const row = await tdb.siteContent.findFirst({ where: { key } });
  if (!row) return fb;
  return (row.value as T) ?? fb;
}

export default async function ExtrasPage() {
  const { tdb } = await ssrTenant();
  const [rating, tagline, areas] = await Promise.all([
    getJson<{ rating?: number; count?: number }>(tdb, 'google_rating_summary', {}),
    getJson<string>(tdb, 'footer_tagline', ''),
    getJson<string[]>(tdb, 'service_areas', []),
  ]);

  return (
    <div>
      <WebsiteTabs />
      <h1 className="text-xl font-semibold mt-6 mb-4">Extras</h1>
      <p className="text-sm text-slate-500 mb-4">
        Misc site content: aggregate review rating, footer tagline, and service areas
        (neighborhoods / cities you serve, used in SEO and the footer).
      </p>
      <div className="space-y-8">
        <RatingSummaryEditor initial={{ rating: rating.rating ?? 0, count: rating.count ?? 0 }} />
        <FooterTaglineEditor initial={tagline} />
        <StringListEditor
          storageKey="service_areas"
          initial={areas}
          label="Service areas"
        />
      </div>
    </div>
  );
}
