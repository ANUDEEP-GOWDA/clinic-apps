import Link from 'next/link';
import { ssrTenant } from '@/lib/ssr-tenant';
import StringListEditor from '@/components/cms/StringListEditor';
import WebsiteTabs from '@/components/cms/WebsiteTabs';

export const dynamic = 'force-dynamic';

async function getList(tdb: Awaited<ReturnType<typeof ssrTenant>>["tdb"], key: string): Promise<string[]> {
  const row = await tdb.siteContent.findFirst({ where: { key } });
  if (!row) return [];
  const v = row.value;
  return Array.isArray(v) ? v : [];
}

export default async function HeroEditorPage() {
  const { tdb } = await ssrTenant();
  const badges = await getList(tdb, 'hero_badges');
  return (
    <div>
      <WebsiteTabs />
      <h1 className="text-xl font-semibold mt-6 mb-1">Hero — trust badges</h1>
      <p className="text-sm text-slate-500 mb-4">
        Hero headline, subheadline, and image are configured in{' '}
        <Link href="/cms/settings" className="underline">Settings</Link>.
      </p>
      <StringListEditor storageKey="hero_badges" initial={badges} label="Trust badges" />
    </div>
  );
}
