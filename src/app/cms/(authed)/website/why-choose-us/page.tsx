import { ssrTenant } from '@/lib/ssr-tenant';
import WhyChooseUsEditor from '@/components/cms/WhyChooseUsEditor';
import WebsiteTabs from '@/components/cms/WebsiteTabs';

export const dynamic = 'force-dynamic';

type Item = { icon: string; title: string; description: string };

async function getJson<T>(
  tdb: Awaited<ReturnType<typeof ssrTenant>>['tdb'],
  key: string,
  fb: T
): Promise<T> {
  const row = await tdb.siteContent.findFirst({ where: { key } });
  if (!row) return fb;
  return (row.value as T) ?? fb;
}

export default async function WhyChooseUsPage() {
  const { tdb } = await ssrTenant();
  const items = await getJson<Item[]>(tdb, 'why_choose_us', []);
  return (
    <div>
      <WebsiteTabs />
      <h1 className="text-xl font-semibold mt-6 mb-4">Why Choose Us</h1>
      <p className="text-sm text-slate-500 mb-4">
        Four feature highlights shown on the homepage. Aim for 4 items for the cleanest layout.
      </p>
      <WhyChooseUsEditor initial={items} />
    </div>
  );
}
