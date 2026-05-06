import { ssrTenant } from '@/lib/ssr-tenant';
import FaqEditor from '@/components/cms/FaqEditor';
import WebsiteTabs from '@/components/cms/WebsiteTabs';

export const dynamic = 'force-dynamic';

type FAQ = { question: string; answer: string };

async function getJson<T>(
  tdb: Awaited<ReturnType<typeof ssrTenant>>['tdb'],
  key: string,
  fb: T
): Promise<T> {
  const row = await tdb.siteContent.findFirst({ where: { key } });
  if (!row) return fb;
  return (row.value as T) ?? fb;
}

export default async function FaqPage() {
  const { tdb } = await ssrTenant();
  const items = await getJson<FAQ[]>(tdb, 'faq', []);
  return (
    <div>
      <WebsiteTabs />
      <h1 className="text-xl font-semibold mt-6 mb-1">Frequently Asked Questions</h1>
      <p className="text-sm text-slate-500 mb-4">
        Used to power the FAQ section on the public site and structured FAQ data for SEO.
      </p>
      <FaqEditor initial={items} />
    </div>
  );
}
